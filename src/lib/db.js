import { Pool } from "pg";
import { NEGOCIOS_DATA } from "./constants.js";

let pool = null;

export function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    let cleanConnectionString = connectionString;
    let isLocalhost = false;

    try {
      const url = new URL(connectionString);
      isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      url.searchParams.delete("sslmode");
      cleanConnectionString = url.toString();
    } catch (e) {
      isLocalhost =
        connectionString.includes("localhost") ||
        connectionString.includes("127.0.0.1");
    }

    pool = new Pool({
      connectionString: cleanConnectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("[PostgreSQL Pool Error]:", err.message);
    });
  }

  return pool;
}

export async function query(text, params = []) {
  const p = getPool();
  if (!p) {
    throw new Error("DATABASE_URL no está configurada");
  }
  const result = await p.query(text, params);
  return { rows: result.rows, rowCount: result.rowCount ?? 0 };
}

// Fallback seed de opiniones iniciales si la BD no está disponible
const SEED_OPINIONES = {
  "calzado-urbano-pe": [
    {
      id: 1,
      negocio_id: 1,
      nombre: "María P.",
      puntos: 5,
      compra_confirmada: true,
      comentario: "El producto llegó tal como en las fotos.",
      estado: "aprobada",
      creado_en: "2026-11-09T22:06:31.068Z",
    },
    {
      id: 2,
      negocio_id: 1,
      nombre: "Luis R.",
      puntos: 4,
      compra_confirmada: true,
      comentario: "Buen producto. El envío tardó un día más de lo acordado.",
      estado: "aprobada",
      creado_en: "2026-11-09T22:06:31.068Z",
    },
  ],
  "eco-hogar": [
    {
      id: 3,
      negocio_id: 2,
      nombre: "Ronald Z.",
      puntos: 5,
      compra_confirmada: true,
      comentario: "Me respondió rápido y la decoración quedó preciosa.",
      estado: "aprobada",
      creado_en: "2026-11-09T22:06:31.068Z",
    },
    {
      id: 4,
      negocio_id: 2,
      nombre: "Thvlin S.",
      puntos: 4,
      compra_confirmada: true,
      comentario: "Hermosa decoración y gran atención para el evento.",
      estado: "aprobada",
      creado_en: "2026-11-09T22:06:31.068Z",
    },
  ],
  "tech-soluciones": [
    {
      id: 5,
      negocio_id: 3,
      nombre: "Sebasthian R.",
      puntos: 5,
      compra_confirmada: true,
      comentario: "Me arregló bien mi celular, ya no tiene tres pantallas.",
      estado: "aprobada",
      creado_en: "2026-11-09T22:06:31.068Z",
    },
    {
      id: 6,
      negocio_id: 3,
      nombre: "Andres S.",
      puntos: 4,
      compra_confirmada: true,
      comentario: "Buena atención y servicio rápido en el diagnóstico.",
      estado: "aprobada",
      creado_en: "2026-11-09T22:06:31.068Z",
    },
  ],
};

export async function buscarNegocioId(slug) {
  try {
    const { rows } = await query(
      "SELECT id FROM negocios WHERE slug = $1",
      [slug.trim().slice(0, 80)]
    );
    return rows[0] ? rows[0].id : null;
  } catch (err) {
    if (slug === "calzado-urbano-pe") return 1;
    if (slug === "eco-hogar") return 2;
    if (slug === "tech-soluciones") return 3;
    return null;
  }
}

export async function obtenerNegocios() {
  try {
    const { rows } = await query(
      `SELECT n.id, n.slug, n.nombre, n.categoria, n.ciudad, n.nivel, n.creado_en,
              COALESCE(AVG(o.puntos), 5.0)::numeric(2,1) AS promedio_puntos,
              COUNT(o.id)::int AS total_opiniones
         FROM negocios n
         LEFT JOIN opiniones o ON o.negocio_id = n.id AND o.estado = 'aprobada'
        GROUP BY n.id
        ORDER BY n.id ASC`
    );

    return rows.map((r) => {
      const extra = NEGOCIOS_DATA[r.slug] || {};
      return {
        ...r,
        ...extra,
        id: Number(r.id),
      };
    });
  } catch (err) {
    console.warn("[PostgreSQL] Usando datos fallback para negocios:", err.message);
    return Object.keys(NEGOCIOS_DATA).map((slug, index) => {
      const info = NEGOCIOS_DATA[slug];
      return {
        id: index + 1,
        slug,
        nombre: info.nombre || slug,
        categoria: info.categoria || "Comercio",
        ciudad: info.ciudad || "Perú",
        nivel: info.nivel || "Nuevo",
        ...info,
      };
    });
  }
}

export async function obtenerNegocioPorSlug(slug) {
  try {
    const { rows } = await query(
      `SELECT id, slug, nombre, categoria, ciudad, nivel, creado_en
         FROM negocios
        WHERE slug = $1`,
      [slug]
    );

    if (rows.length > 0) {
      const r = rows[0];
      const extra = NEGOCIOS_DATA[r.slug] || {};
      return {
        ...r,
        ...extra,
        id: Number(r.id),
      };
    }
  } catch (err) {
    console.warn(`[PostgreSQL] Fallback para negocio ${slug}:`, err.message);
  }

  const fallback = NEGOCIOS_DATA[slug];
  if (fallback) {
    const idMap = {
      "calzado-urbano-pe": 1,
      "eco-hogar": 2,
      "tech-soluciones": 3,
    };
    return {
      id: idMap[slug] || 99,
      slug,
      nombre: fallback.nombre || slug,
      categoria: fallback.categoria || "",
      ciudad: fallback.ciudad || "",
      nivel: fallback.nivel || "Nuevo",
      ...fallback,
    };
  }

  return null;
}

export async function obtenerOpinionesAprobadas(slug) {
  try {
    const { rows } = await query(
      `SELECT o.id, o.negocio_id, o.nombre, o.puntos, o.compra_confirmada, o.comentario, o.creado_en, o.estado
         FROM opiniones o
         JOIN negocios n ON n.id = o.negocio_id
        WHERE n.slug = $1 AND o.estado = 'aprobada'
        ORDER BY o.creado_en DESC`,
      [slug]
    );
    return rows;
  } catch (err) {
    console.warn(`[PostgreSQL] Fallback de opiniones para ${slug}`);
    return SEED_OPINIONES[slug] || [];
  }
}

export async function obtenerSugerencias(visitante) {
  const visitanteLimpio = visitante.trim().slice(0, 64);
  try {
    const { rows } = await query(
      `WITH preferencia AS (
         SELECT n.categoria,
                SUM(CASE e.tipo WHEN 'carrito' THEN 3 ELSE 1 END) AS puntos,
                MAX(e.creado_en) AS ultima
           FROM eventos e
           JOIN negocios n ON n.id = e.negocio_id
          WHERE e.visitante = $1
          GROUP BY n.categoria
       ),
       popularidad AS (
         SELECT negocio_id, COUNT(*) AS total
           FROM eventos
          GROUP BY negocio_id
       )
       SELECT n.slug, n.nombre, n.categoria, n.ciudad,
              COALESCE(p.puntos, 0)::int AS puntos
         FROM negocios n
         LEFT JOIN preferencia p ON p.categoria = n.categoria
         LEFT JOIN popularidad pop ON pop.negocio_id = n.id
        ORDER BY COALESCE(p.puntos, 0) DESC,
                 p.ultima DESC NULLS LAST,
                 COALESCE(pop.total, 0) DESC,
                 n.nombre
        LIMIT 3`,
      [visitanteLimpio]
    );
    return rows;
  } catch (err) {
    console.warn("[PostgreSQL] Fallback de sugerencias:", err.message);
    return [
      {
        slug: "calzado-urbano-pe",
        nombre: "Calzado Urbano PE",
        categoria: "Calzado y Moda",
        ciudad: "Cajamarca",
        puntos: 0,
      },
      {
        slug: "tech-soluciones",
        nombre: "Tech Soluciones",
        categoria: "Tecnología",
        ciudad: "Carabayllo",
        puntos: 0,
      },
      {
        slug: "eco-hogar",
        nombre: "Eco Hogar",
        categoria: "Artículos del Hogar",
        ciudad: "Arequipa",
        puntos: 0,
      },
    ];
  }
}
