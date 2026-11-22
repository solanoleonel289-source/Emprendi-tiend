import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { minarEstadisticasAdmin } from "@/lib/mining";
import { obtenerAdminDeRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const admin = obtenerAdminDeRequest(req);
  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado. Inicie sesión para acceder al panel de administración." },
      { status: 401 }
    );
  }

  let opinionesRows = [];
  let reportesRows = [];
  let solicitudesRows = [];
  let isOffline = false;

  try {
    const opiniones = await query(
      `SELECT o.*, n.nombre AS negocio_nombre, n.slug AS negocio_slug
         FROM opiniones o
         LEFT JOIN negocios n ON n.id = o.negocio_id
        ORDER BY o.creado_en DESC
        LIMIT 50`
    );
    opinionesRows = opiniones.rows || [];
  } catch (e) {
    isOffline = true;
  }

  try {
    const reportes = await query(
      `SELECT r.*, n.nombre AS negocio_nombre, n.slug AS negocio_slug
         FROM reportes r
         LEFT JOIN negocios n ON n.id = r.negocio_id
        ORDER BY r.creado_en DESC
        LIMIT 50`
    );
    reportesRows = reportes.rows || [];
  } catch (e) {
    isOffline = true;
  }

  try {
    const solicitudes = await query(
      `SELECT * FROM solicitudes ORDER BY creado_en DESC LIMIT 50`
    );
    solicitudesRows = solicitudes.rows || [];
  } catch (e) {
    isOffline = true;
  }

  // Cargar telemetría (resiliente: funciona tanto con PostgreSQL como con almacén local)
  const telemetria = await minarEstadisticasAdmin();

  return NextResponse.json({
    opiniones: opinionesRows,
    reportes: reportesRows,
    solicitudes: solicitudesRows,
    eventos: telemetria.eventosPorTipo || [],
    telemetria,
    offline: isOffline,
  });
}

export async function PATCH(req) {
  const admin = obtenerAdminDeRequest(req);
  if (!admin) {
    return NextResponse.json(
      { error: "No autorizado. Inicie sesión para modificar registros." },
      { status: 401 }
    );
  }

  try {
    const { tipo, id, estado } = await req.json();

    if (!tipo || !id || !estado) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    if (tipo === "opinion") {
      await query(`UPDATE opiniones SET estado = $1 WHERE id = $2`, [estado, id]);
    } else if (tipo === "reporte") {
      await query(`UPDATE reportes SET estado = $1 WHERE id = $2`, [estado, id]);
    } else if (tipo === "solicitud") {
      await query(`UPDATE solicitudes SET estado = $1 WHERE id = $2`, [estado, id]);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error actualizando estado en admin:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
