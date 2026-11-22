import { query } from "./db.js";
import { NEGOCIOS_DATA } from "./constants.js";

export function obtenerCatalogoCompleto() {
  const catalogo = [];

  for (const slug of Object.keys(NEGOCIOS_DATA)) {
    const negocio = NEGOCIOS_DATA[slug];
    if (!negocio.productos) continue;

    for (const prod of negocio.productos) {
      catalogo.push({
        id: prod.id,
        nombre: prod.nombre,
        precio: prod.precio,
        categoria: prod.categoria,
        categoriaNegocio: negocio.categoria,
        descripcion: prod.descripcion || "",
        imagen: prod.imagen,
        tiendaSlug: negocio.slug,
        tiendaNombre: negocio.nombre,
        ciudad: negocio.ciudad,
        keywords: [
          ...(negocio.keywords || []),
          prod.nombre.toLowerCase(),
          prod.categoria.toLowerCase(),
        ],
      });
    }
  }

  return catalogo;
}

const PESOS_EVENTO = {
  carrito: 5.0, // Máxima intención de compra
  producto: 3.0, // Interés directo en un artículo
  busqueda: 2.5, // Intención activa de búsqueda
  categoria: 2.0, // Exploración temática
  ficha: 1.0, // Vista general de tienda
};

export async function analizarTelemetriaCliente(visitante) {
  const visitanteLimpio = typeof visitante === "string" ? visitante.trim().slice(0, 64) : "";
  if (!visitanteLimpio) {
    return {
      intereses: [],
      palabrasClave: [],
      productosVistos: [],
      tiendasFrecuentes: {},
      totalEventos: 0,
      categoriaPrincipal: null,
      nivelIntencion: "Explorador",
    };
  }

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

    if (!rows || rows.length === 0) {
      return {
        intereses: [],
        palabrasClave: [],
        productosVistos: [],
        tiendasFrecuentes: {},
        totalEventos: 0,
        categoriaPrincipal: null,
        nivelIntencion: "Nuevo Visitante",
      };
    }

    const scoresCategoria = {};
    const palabrasFrecuencia = {};
    const productosVistos = new Set();
    const tiendasFrecuentes = {};
    let totalPuntos = 0;
    let eventosCarrito = 0;
    let eventosProducto = 0;

    const ahora = Date.now();

    for (const ev of rows) {
      const pesoBase = PESOS_EVENTO[ev.tipo] || 1.0;

      const duracionSegundos = Number(ev.duracion_segundos) || 0;
      let multiplicadorTiempo = 1.0;
      if (duracionSegundos > 0) {
        
        multiplicadorTiempo = 1.0 + Math.min((duracionSegundos / 10) * 0.5, 3.5);
      }

      
      const antiguedadDias = (ahora - new Date(ev.creado_en).getTime()) / (1000 * 60 * 60 * 24);
      const factorTiempo = 1 / (1 + Math.max(0, antiguedadDias) * 0.15);
      const pesoFinal = (ev.tipo === "tiempo" ? 2.5 : pesoBase) * factorTiempo * multiplicadorTiempo;

      totalPuntos += pesoFinal;

      const cat = ev.negocio_categoria || "General";
      scoresCategoria[cat] = (scoresCategoria[cat] || 0) + pesoFinal;

      if (ev.negocio_slug) {
        tiendasFrecuentes[ev.negocio_slug] = (tiendasFrecuentes[ev.negocio_slug] || 0) + pesoFinal;
      }

      if (ev.producto) {
        productosVistos.add(ev.producto.toLowerCase().trim());

        const palabras = ev.producto
          .toLowerCase()
          .replace(/[^a-záéíóúñ0-9\s]/gi, "")
          .split(/\s+/)
          .filter((w) => w.length > 3 && !["para", "con", "del", "las", "los", "una", "uno"].includes(w));

        for (const pal of palabras) {
          palabrasFrecuencia[pal] =
            (palabrasFrecuencia[pal] || 0) + (ev.tipo === "busqueda" ? 2 : 1) * multiplicadorTiempo;
        }
      }

      if (ev.tipo === "carrito") eventosCarrito++;
      if (ev.tipo === "producto" || (ev.tipo === "tiempo" && duracionSegundos >= 5)) eventosProducto++;
    }

    const intereses = Object.entries(scoresCategoria)
      .map(([categoria, puntos]) => ({
        categoria,
        puntos: Number(puntos.toFixed(1)),
        porcentaje: totalPuntos > 0 ? Math.round((puntos / totalPuntos) * 100) : 0,
      }))
      .sort((a, b) => b.puntos - a.puntos);

    const palabrasClave = Object.entries(palabrasFrecuencia)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([palabra]) => palabra);

    let nivelIntencion = "Explorador";
    if (eventosCarrito > 0) {
      nivelIntencion = "Comprador Decidido";
    } else if (eventosProducto >= 2 || rows.length >= 4) {
      nivelIntencion = "Comparador Activo";
    }

    return {
      intereses,
      palabrasClave,
      productosVistos: Array.from(productosVistos),
      tiendasFrecuentes,
      totalEventos: rows.length,
      categoriaPrincipal: intereses[0]?.categoria || null,
      nivelIntencion,
    };
  } catch (err) {
    console.warn("[Minería] Error analizando telemetría de cliente:", err.message);
    return {
      intereses: [],
      palabrasClave: [],
      productosVistos: [],
      tiendasFrecuentes: {},
      totalEventos: 0,
      categoriaPrincipal: null,
      nivelIntencion: "Visitante",
    };
  }
}

export async function obtenerPopularidadGlobal() {
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
    console.warn("[Minería] Error obteniendo popularidad global:", err.message);
    return {};
  }
}

export async function minarRecomendacionesProductos(visitante, limite = 4) {
  const catalogo = obtenerCatalogoCompleto();
  const [perfil, popularidadGlobal] = await Promise.all([
    analizarTelemetriaCliente(visitante),
    obtenerPopularidadGlobal(),
  ]);

  const esPersonalizado = perfil.intereses.length > 0;
  const mapaIntereses = {};
  for (const item of perfil.intereses) {
    mapaIntereses[item.categoria] = item.porcentaje;
  }

  const productosPuntuados = catalogo.map((prod) => {
    let score = 0;
    const razones = [];

    const afinidadCategoria = mapaIntereses[prod.categoriaNegocio] || 0;
    if (afinidadCategoria > 0) {
      score += (afinidadCategoria / 100) * 15.0;
      razones.push(`Interés en ${prod.categoriaNegocio} (${afinidadCategoria}%)`);
    }

    const textoProducto = `${prod.nombre} ${prod.categoria} ${prod.descripcion} ${prod.keywords.join(" ")}`.toLowerCase();
    let palabrasCoincidentes = 0;
    let palabraCoincidenteTexto = "";

    for (const pal of perfil.palabrasClave) {
      if (textoProducto.includes(pal)) {
        palabrasCoincidentes++;
        if (!palabraCoincidenteTexto) palabraCoincidenteTexto = pal;
      }
    }

    if (palabrasCoincidentes > 0) {
      score += palabrasCoincidentes * 4.0;
      razones.push(`Coincide con tu búsqueda de "${palabraCoincidenteTexto}"`);
    }

    const afinidadTienda = perfil.tiendasFrecuentes[prod.tiendaSlug] || 0;
    if (afinidadTienda > 0) {
      score += Math.min(afinidadTienda * 1.5, 6.0);
      razones.push(`Has visitado ${prod.tiendaNombre}`);
    }

    const pop = popularidadGlobal[prod.nombre.toLowerCase().trim()] || 0;
    score += Math.min(pop * 1.2, 8.0);
    if (pop > 0 && razones.length === 0) {
      razones.push(`Muy solicitado por la comunidad (${pop} interacciones)`);
    }

    const yaEnCarrito = perfil.productosVistos.includes(prod.nombre.toLowerCase().trim());
    if (yaEnCarrito) {
      score -= 3.0; 
    }

    if (razones.length === 0) {
      razones.push("Recomendado por la comunidad de EmprendiTienda");
    }

    return {
      ...prod,
      score: Number(score.toFixed(1)),
      razon: razones[0],
      yaEnCarrito,
    };
  });

  productosPuntuados.sort((a, b) => b.score - a.score);

  return {
    perfil,
    productos: productosPuntuados.slice(0, limite),
    esPersonalizado,
  };
}

export async function minarEstadisticasAdmin() {
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
    console.warn("[Minería] Error en estadísticas admin:", err.message);
    return {
      eventosPorTipo: [],
      interesPorCategoria: [],
      topProductosCarrito: [],
      eventosRecientes: [],
    };
  }
}
