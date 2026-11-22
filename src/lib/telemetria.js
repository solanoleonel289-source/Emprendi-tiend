import fs from "fs";
import path from "path";
import { query } from "./db.js";
import { NEGOCIOS_DATA } from "./constants.js";

// Ruta para persistencia local de eventos cuando la BD está offline
const DATA_DIR = path.join(process.cwd(), "src", "data");
const EVENTOS_FILE = path.join(DATA_DIR, "telemetria-eventos.json");
const SEED_FILE = path.join(DATA_DIR, "telemetria-seed.json");

// Memoria cache de eventos
let eventosCache = null;
let lastMtime = 0;

// Negocios de referencia
const MAPA_NEGOCIOS = {
  "calzado-urbano-pe": { id: 1, nombre: "Calzado Urbano PE", categoria: "Calzado y Moda", slug: "calzado-urbano-pe" },
  "eco-hogar": { id: 2, nombre: "Eco Hogar", categoria: "Artículos del Hogar", slug: "eco-hogar" },
  "tech-soluciones": { id: 3, nombre: "Tech Soluciones", categoria: "Tecnología", slug: "tech-soluciones" },
};

function normalizarNegocio(slug) {
  if (slug && MAPA_NEGOCIOS[slug]) {
    return MAPA_NEGOCIOS[slug];
  }
  return { id: 1, nombre: "Calzado Urbano PE", categoria: "Calzado y Moda", slug: "calzado-urbano-pe" };
}

/**
 * Carga los eventos desde el archivo local o desde el seed inicial
 */
function cargarEventosLocales() {
  try {
    if (fs.existsSync(EVENTOS_FILE)) {
      const stat = fs.statSync(EVENTOS_FILE);
      if (!eventosCache || stat.mtimeMs > lastMtime) {
        const data = fs.readFileSync(EVENTOS_FILE, "utf-8");
        eventosCache = JSON.parse(data);
        lastMtime = stat.mtimeMs;
      }
      return eventosCache;
    }
  } catch (err) {
    console.warn("[Telemetría] Error leyendo eventos locales:", err.message);
  }

  try {
    if (fs.existsSync(SEED_FILE)) {
      const seedData = fs.readFileSync(SEED_FILE, "utf-8");
      eventosCache = JSON.parse(seedData);
      guardarEventosEnDisco(eventosCache);
      return eventosCache;
    }
  } catch (err) {
    console.warn("[Telemetría] Error leyendo seed de telemetría:", err.message);
  }

  eventosCache = [];
  return eventosCache;
}

/**
 * Guarda los eventos en disco de forma segura
 */
function guardarEventosEnDisco(lista) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(EVENTOS_FILE, JSON.stringify(lista, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Telemetría] Error guardando eventos en disco:", err.message);
  }
}

const TIPOS_VALIDOS = ["ficha", "carrito", "producto", "busqueda", "categoria", "tiempo"];

/**
 * Registra un evento en telemetría de forma resiliente
 */
export async function registrarEventoServidor({
  visitante,
  usuario_nombre,
  slug,
  tipo,
  producto,
  duracion_segundos = 0,
}) {
  const visitanteValido =
    typeof visitante === "string" && visitante.trim().length > 0
      ? visitante.trim().slice(0, 80)
      : "anon-" + Date.now();

  const usuarioNombre =
    typeof usuario_nombre === "string" && usuario_nombre.trim()
      ? usuario_nombre.trim().slice(0, 100)
      : null;

  const tipoFinal = TIPOS_VALIDOS.includes(tipo) ? tipo : "ficha";
  const slugLimpio = typeof slug === "string" ? slug.trim().slice(0, 80) : "general";
  const productoFinal =
    typeof producto === "string" && producto.trim()
      ? producto.trim().slice(0, 120)
      : null;

  const duracion = Math.max(
    0,
    Math.min(86400, Math.round(Number(duracion_segundos) || 0))
  );

  const infoNegocio = normalizarNegocio(slugLimpio);

  // 1. Guardar en memoria y disco local
  const lista = cargarEventosLocales();
  const maxId = lista.length > 0 ? Math.max(...lista.map((e) => Number(e.id) || 0)) : 0;
  const nuevoEvento = {
    id: maxId + 1,
    visitante: visitanteValido,
    usuario_nombre: usuarioNombre || "Visitante Anónimo",
    negocio_id: infoNegocio.id,
    negocio_nombre: infoNegocio.nombre,
    negocio_categoria: infoNegocio.categoria,
    negocio_slug: infoNegocio.slug,
    tipo: tipoFinal,
    producto: productoFinal,
    duracion_segundos: duracion,
    creado_en: new Date().toISOString(),
  };

  lista.push(nuevoEvento);
  guardarEventosEnDisco(lista);

  // 2. Intentar guardar en PostgreSQL en segundo plano sin congelar al cliente
  (async () => {
    try {
      await query(
        `INSERT INTO eventos (visitante, usuario_nombre, negocio_id, tipo, producto, duracion_segundos)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [visitanteValido, usuarioNombre, infoNegocio.id, tipoFinal, productoFinal, duracion]
      );
    } catch (e) {
      // Si la BD está offline, ya está registrado en local
    }
  })().catch(() => {});

  return { ok: true, id: nuevoEvento.id };
}

/**
 * Retorna las estadísticas completas de telemetría para el panel de administración
 */
export async function obtenerEstadisticasAdmin() {
  // Intentar consultar PostgreSQL primero
  try {
    const resTipos = await query(
      `SELECT e.tipo, count(*)::int AS total
         FROM eventos e
        GROUP BY e.tipo
        ORDER BY total DESC`
    );

    const resCategorias = await query(
      `SELECT n.categoria,
              count(*)::int AS total_interacciones,
              count(CASE WHEN e.tipo = 'carrito' THEN 1 END)::int AS total_carritos
         FROM eventos e
         JOIN negocios n ON n.id = e.negocio_id
        GROUP BY n.categoria
        ORDER BY total_interacciones DESC`
    );

    const resTopProductos = await query(
      `SELECT e.producto, count(*)::int AS total_carritos
         FROM eventos e
        WHERE e.tipo = 'carrito' AND e.producto IS NOT NULL
        GROUP BY e.producto
        ORDER BY total_carritos DESC
        LIMIT 5`
    );

    const resTiempo = await query(
      `SELECT COALESCE(ROUND(AVG(duracion_segundos)), 0)::int AS promedio_segundos,
              COALESCE(SUM(duracion_segundos), 0)::int AS total_segundos,
              COALESCE(MAX(duracion_segundos), 0)::int AS max_segundos
         FROM eventos
        WHERE duracion_segundos > 0`
    );

    const resTopTiempo = await query(
      `SELECT e.producto,
              SUM(e.duracion_segundos)::int AS segundos_totales,
              ROUND(AVG(e.duracion_segundos))::int AS promedio_segundos,
              COUNT(*)::int AS total_sesiones
         FROM eventos e
        WHERE e.duracion_segundos > 0 AND e.producto IS NOT NULL AND e.producto != ''
        GROUP BY e.producto
        ORDER BY segundos_totales DESC
        LIMIT 5`
    );

    const resRecientes = await query(
      `SELECT e.id, e.visitante, e.usuario_nombre, e.tipo, e.producto, e.creado_en, e.duracion_segundos,
              n.nombre AS negocio_nombre, n.categoria AS negocio_categoria
         FROM eventos e
         JOIN negocios n ON n.id = e.negocio_id
        ORDER BY e.creado_en DESC
        LIMIT 15`
    );

    const resUsuarios = await query(
      `SELECT e.visitante,
              COALESCE(MAX(e.usuario_nombre), 'Visitante Anónimo') AS nombre_usuario,
              COALESCE(SUM(e.duracion_segundos), 0)::int AS segundos_totales,
              COUNT(*)::int AS total_eventos,
              COUNT(CASE WHEN e.tipo = 'carrito' THEN 1 END)::int AS total_carritos,
              MAX(e.creado_en) AS ultima_actividad,
              MIN(e.creado_en) AS primera_visita
         FROM eventos e
        GROUP BY e.visitante
        ORDER BY segundos_totales DESC, total_eventos DESC
        LIMIT 25`
    );

    const resDetallePorUsuario = await query(
      `SELECT e.visitante,
              e.producto,
              COALESCE(SUM(e.duracion_segundos), 0)::int AS segundos,
              COUNT(*)::int AS veces
         FROM eventos e
        WHERE e.producto IS NOT NULL AND e.producto != ''
        GROUP BY e.visitante, e.producto
        ORDER BY segundos DESC, veces DESC`
    );

    const mapaDetalle = {};
    for (const d of resDetallePorUsuario.rows || []) {
      if (!mapaDetalle[d.visitante]) mapaDetalle[d.visitante] = [];
      mapaDetalle[d.visitante].push({
        producto: d.producto,
        segundos: d.segundos,
        veces: d.veces,
      });
    }

    const tiempoPorUsuario = (resUsuarios.rows || []).map((u) => ({
      ...u,
      minutos_totales: Number((u.segundos_totales / 60).toFixed(1)),
      productos_vistos: mapaDetalle[u.visitante] || [],
    }));

    return {
      eventosPorTipo: resTipos.rows || [],
      interesPorCategoria: resCategorias.rows || [],
      topProductosCarrito: resTopProductos.rows || [],
      metricasTiempo: resTiempo.rows[0] || { promedio_segundos: 0, total_segundos: 0, max_segundos: 0 },
      topPermanencia: resTopTiempo.rows || [],
      eventosRecientes: resRecientes.rows || [],
      tiempoPorUsuario,
    };
  } catch (err) {
    // Si PostgreSQL falla o está offline, calcular desde el almacén local
    return calcularEstadisticasDesdeEventosLocales();
  }
}

/**
 * Calcula todas las métricas en memoria a partir de los eventos locales
 */
function calcularEstadisticasDesdeEventosLocales() {
  const eventos = cargarEventosLocales();

  // 1. eventosPorTipo
  const conteoTipos = {};
  for (const ev of eventos) {
    conteoTipos[ev.tipo] = (conteoTipos[ev.tipo] || 0) + 1;
  }
  const eventosPorTipo = Object.entries(conteoTipos)
    .map(([tipo, total]) => ({ tipo, total }))
    .sort((a, b) => b.total - a.total);

  // 2. interesPorCategoria
  const catStats = {};
  for (const ev of eventos) {
    const cat = ev.negocio_categoria || "General";
    if (!catStats[cat]) {
      catStats[cat] = { categoria: cat, total_interacciones: 0, total_carritos: 0 };
    }
    catStats[cat].total_interacciones++;
    if (ev.tipo === "carrito") {
      catStats[cat].total_carritos++;
    }
  }
  const interesPorCategoria = Object.values(catStats).sort(
    (a, b) => b.total_interacciones - a.total_interacciones
  );

  // 3. topProductosCarrito
  const carritoConteo = {};
  for (const ev of eventos) {
    if (ev.tipo === "carrito" && ev.producto) {
      carritoConteo[ev.producto] = (carritoConteo[ev.producto] || 0) + 1;
    }
  }
  const topProductosCarrito = Object.entries(carritoConteo)
    .map(([producto, total_carritos]) => ({ producto, total_carritos }))
    .sort((a, b) => b.total_carritos - a.total_carritos)
    .slice(0, 5);

  // 4. metricasTiempo
  const eventosConTiempo = eventos.filter((e) => (Number(e.duracion_segundos) || 0) > 0);
  let totalSegundos = 0;
  let maxSegundos = 0;
  for (const ev of eventosConTiempo) {
    const d = Number(ev.duracion_segundos) || 0;
    totalSegundos += d;
    if (d > maxSegundos) maxSegundos = d;
  }
  const promedioSegundos =
    eventosConTiempo.length > 0 ? Math.round(totalSegundos / eventosConTiempo.length) : 0;

  const metricasTiempo = {
    promedio_segundos: promedioSegundos,
    total_segundos: totalSegundos,
    max_segundos: maxSegundos,
  };

  // 5. topPermanencia
  const prodTiempo = {};
  for (const ev of eventosConTiempo) {
    if (ev.producto) {
      if (!prodTiempo[ev.producto]) {
        prodTiempo[ev.producto] = { segundos_totales: 0, total_sesiones: 0 };
      }
      prodTiempo[ev.producto].segundos_totales += Number(ev.duracion_segundos) || 0;
      prodTiempo[ev.producto].total_sesiones++;
    }
  }
  const topPermanencia = Object.entries(prodTiempo)
    .map(([producto, data]) => ({
      producto,
      segundos_totales: data.segundos_totales,
      promedio_segundos: Math.round(data.segundos_totales / data.total_sesiones),
      total_sesiones: data.total_sesiones,
    }))
    .sort((a, b) => b.segundos_totales - a.segundos_totales)
    .slice(0, 5);

  // 6. eventosRecientes
  const eventosRecientes = [...eventos]
    .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime())
    .slice(0, 15);

  // 7. tiempoPorUsuario
  const userMap = {};
  for (const ev of eventos) {
    const v = ev.visitante || "anonimo";
    if (!userMap[v]) {
      userMap[v] = {
        visitante: v,
        nombre_usuario: ev.usuario_nombre || "Visitante Anónimo",
        segundos_totales: 0,
        total_eventos: 0,
        total_carritos: 0,
        primera_visita: ev.creado_en,
        ultima_actividad: ev.creado_en,
        productosMap: {},
      };
    }
    const u = userMap[v];
    u.total_eventos++;
    if (ev.usuario_nombre && ev.usuario_nombre !== "Visitante Anónimo") {
      u.nombre_usuario = ev.usuario_nombre;
    }
    const d = Number(ev.duracion_segundos) || 0;
    u.segundos_totales += d;
    if (ev.tipo === "carrito") u.total_carritos++;

    if (new Date(ev.creado_en).getTime() > new Date(u.ultima_actividad).getTime()) {
      u.ultima_actividad = ev.creado_en;
    }
    if (new Date(ev.creado_en).getTime() < new Date(u.primera_visita).getTime()) {
      u.primera_visita = ev.creado_en;
    }

    if (ev.producto) {
      if (!u.productosMap[ev.producto]) {
        u.productosMap[ev.producto] = { producto: ev.producto, segundos: 0, veces: 0 };
      }
      u.productosMap[ev.producto].segundos += d;
      u.productosMap[ev.producto].veces++;
    }
  }

  const tiempoPorUsuario = Object.values(userMap)
    .map((u) => ({
      visitante: u.visitante,
      nombre_usuario: u.nombre_usuario,
      segundos_totales: u.segundos_totales,
      minutos_totales: Number((u.segundos_totales / 60).toFixed(1)),
      total_eventos: u.total_eventos,
      total_carritos: u.total_carritos,
      primera_visita: u.primera_visita,
      ultima_actividad: u.ultima_actividad,
      productos_vistos: Object.values(u.productosMap).sort((a, b) => b.segundos - a.segundos),
    }))
    .sort((a, b) => b.segundos_totales - a.segundos_totales || b.total_eventos - a.total_eventos)
    .slice(0, 25);

  return {
    eventosPorTipo,
    interesPorCategoria,
    topProductosCarrito,
    metricasTiempo,
    topPermanencia,
    eventosRecientes,
    tiempoPorUsuario,
  };
}

/**
 * Obtiene los eventos de un visitante (para el algoritmo de recomendaciones)
 */
export async function obtenerEventosPorVisitante(visitante) {
  const visitanteLimpio = typeof visitante === "string" ? visitante.trim().slice(0, 80) : "";
  if (!visitanteLimpio) return [];

  try {
    const { rows } = await query(
      `SELECT e.id, e.tipo, e.producto, e.creado_en, e.duracion_segundos,
              n.nombre AS negocio_nombre, n.categoria AS negocio_categoria, n.slug AS negocio_slug
         FROM eventos e
         JOIN negocios n ON n.id = e.negocio_id
        WHERE e.visitante = $1
        ORDER BY e.creado_en DESC
        LIMIT 100`,
      [visitanteLimpio]
    );
    if (rows && rows.length > 0) return rows;
  } catch (err) {
    // Si PostgreSQL falla, continuar con almacenamiento local
  }

  const eventos = cargarEventosLocales();
  return eventos
    .filter((e) => e.visitante === visitanteLimpio)
    .sort((a, b) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime())
    .slice(0, 100);
}

/**
 * Obtiene la popularidad global ponderada de los productos
 */
export async function obtenerPopularidadGlobalProductos() {
  try {
    const { rows } = await query(
      `SELECT e.producto, e.tipo, count(*)::int AS conteo
         FROM eventos e
        WHERE e.producto IS NOT NULL AND e.producto != ''
        GROUP BY e.producto, e.tipo`
    );

    const conteoProductos = {};
    for (const r of rows) {
      const nombre = r.producto.toLowerCase().trim();
      const mult = r.tipo === "carrito" ? 3 : 1;
      conteoProductos[nombre] = (conteoProductos[nombre] || 0) + r.conteo * mult;
    }
    return conteoProductos;
  } catch (err) {
    // Fallback local
  }

  const eventos = cargarEventosLocales();
  const conteoProductos = {};
  for (const ev of eventos) {
    if (ev.producto) {
      const nombre = ev.producto.toLowerCase().trim();
      const mult = ev.tipo === "carrito" ? 3 : 1;
      conteoProductos[nombre] = (conteoProductos[nombre] || 0) + mult;
    }
  }
  return conteoProductos;
}
