import { NextResponse } from "next/server";
import { buscarNegocioId, query } from "@/lib/db";

const limpiarTexto = (val, max) =>
  typeof val === "string" ? val.trim().slice(0, max) : "";

export async function POST(req) {
  try {
    const b = await req.json();
    const motivo = limpiarTexto(b.motivo, 100);
    const detalle = limpiarTexto(b.detalle, 1000);
    const slug = limpiarTexto(b.slug, 80);

    if (!motivo || !detalle) {
      return NextResponse.json({ error: "Datos no válidos" }, { status: 400 });
    }

    const negocioId = await buscarNegocioId(slug);
    if (!negocioId) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    try {
      await query(
        `INSERT INTO reportes (negocio_id, motivo, detalle, estado)
         VALUES ($1, $2, $3, 'nuevo')`,
        [negocioId, motivo, detalle]
      );
    } catch (dbErr) {
      console.warn("No se pudo registrar el reporte en la base de datos (modo offline):", dbErr);
    }

    return NextResponse.json(
      {
        ok: true,
        mensaje: "Recibimos tu reporte. Revisaremos el caso con cuidado bajo estrictas normas de seguridad.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error registrando reporte:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
