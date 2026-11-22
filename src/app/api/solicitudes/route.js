import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const limpiarTexto = (val, max) =>
  typeof val === "string" ? val.trim().slice(0, max) : "";

export async function POST(req) {
  try {
    const b = await req.json();
    const d = {
      nombre: limpiarTexto(b.nombre, 100),
      tienda: limpiarTexto(b.tienda, 100),
      correo: limpiarTexto(b.correo, 120),
      whatsapp: limpiarTexto(b.whatsapp, 25),
      productos: limpiarTexto(b.productos || b.mensaje, 1000),
    };

    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo);
    if (!d.nombre || !d.tienda || !correoValido || !d.whatsapp || !d.productos) {
      return NextResponse.json(
        { error: "Por favor completa todos los campos requeridos correctamente" },
        { status: 400 }
      );
    }

    try {
      await query(
        `INSERT INTO solicitudes (nombre, tienda, correo, whatsapp, productos, estado)
         VALUES ($1, $2, $3, $4, $5, 'pendiente')`,
        [d.nombre, d.tienda, d.correo, d.whatsapp, d.productos]
      );
    } catch (dbErr) {
      console.warn("No se pudo registrar solicitud en DB (modo offline):", dbErr);
    }

    return NextResponse.json(
      {
        ok: true,
        mensaje: "Recibimos tu solicitud. Revisaremos tus datos y te contactaremos por WhatsApp o correo.",
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error guardando solicitud:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { rows } = await query(
      `SELECT id, nombre, tienda, correo, whatsapp, productos, estado, creado_en
         FROM solicitudes
        ORDER BY creado_en DESC`
    );
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json([]);
  }
}
