import { NextResponse } from "next/server";
import { buscarNegocioId, query } from "@/lib/db";

const limpiarTexto = (val, max) =>
  typeof val === "string" ? val.trim().slice(0, max) : "";

const TIPOS_VALIDOS = ["ficha", "carrito", "producto", "busqueda", "categoria", "tiempo"];

export async function POST(req) {
  try {
    const b = await req.json();
    const visitante = limpiarTexto(b.visitante, 64);
    const usuarioNombre = limpiarTexto(b.usuario_nombre || b.usuario, 100) || null;
    const tipo = TIPOS_VALIDOS.includes(b.tipo) ? b.tipo : "ficha";
    const slug = limpiarTexto(b.slug, 80);
    const producto = limpiarTexto(b.producto, 120) || null;
    const duracion = Math.max(
      0,
      Math.min(86400, Math.round(Number(b.duracion_segundos ?? b.duracion) || 0))
    );

    if (!/^[A-Za-z0-9-]{10,64}$/.test(visitante)) {
      return NextResponse.json({ error: "Visitante no válido" }, { status: 400 });
    }

    let negocioId = slug ? await buscarNegocioId(slug) : null;
    if (!negocioId) {
      // Si es un evento global (como búsqueda general o tiempo en pestaña), asociar al negocio id 1
      negocioId = 1;
    }

    try {
      await query(
        `INSERT INTO eventos (visitante, usuario_nombre, negocio_id, tipo, producto, duracion_segundos)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [visitante, usuarioNombre, negocioId, tipo, producto, duracion]
      );
    } catch (dbErr) {
      // El fallo de telemetría no bloquea la experiencia del cliente
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Error registrando evento de telemetría:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
