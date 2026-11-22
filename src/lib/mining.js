import { NEGOCIOS_DATA } from "./constants.js";
import {
  obtenerEstadisticasAdmin as obtenerStatsAdminTelemetria,
  obtenerEventosPorVisitante,
  obtenerPopularidadGlobalProductos,
} from "./telemetria.js";

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
  const visitanteLimpio = typeof visitante === "string" ? visitante.trim().slice(0, 80) : "";
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
    const rows = await obtenerEventosPorVisitante(visitanteLimpio);

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

      const slugNegocio = ev.negocio_slug || ev.slug;
      if (slugNegocio) {
        tiendasFrecuentes[slugNegocio] = (tiendasFrecuentes[slugNegocio] || 0) + pesoFinal;
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
    return await obtenerPopularidadGlobalProductos();
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
    const stats = await obtenerStatsAdminTelemetria();
    return {
      eventosPorTipo: stats.eventosPorTipo || [],
      interesPorCategoria: stats.interesPorCategoria || [],
      topProductosCarrito: stats.topProductosCarrito || [],
      metricasTiempo: stats.metricasTiempo || { promedio_segundos: 0, total_segundos: 0, max_segundos: 0 },
      topPermanencia: stats.topPermanencia || [],
      eventosRecientes: stats.eventosRecientes || [],
      tiempoPorUsuario: stats.tiempoPorUsuario || [],
    };
  } catch (err) {
    console.warn("[Minería] Error en estadísticas admin:", err.message);
    return {
      eventosPorTipo: [],
      interesPorCategoria: [],
      topProductosCarrito: [],
      metricasTiempo: { promedio_segundos: 0, total_segundos: 0, max_segundos: 0 },
      topPermanencia: [],
      eventosRecientes: [],
      tiempoPorUsuario: [],
    };
  }
}
