import { NextResponse } from "next/server";
import { registrarEventoServidor } from "@/lib/telemetria";

export async function POST(req) {
  try {
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      try {
        const raw = await req.text();
        body = raw ? JSON.parse(raw) : {};
      } catch (err) {
        body = {};
      }
    }

    const visitante = body.visitante || "";
    const usuarioNombre = body.usuario_nombre || body.usuario || null;
    const tipo = body.tipo || "ficha";
    const slug = body.slug || "general";
    const producto = body.producto || null;
    const duracionSegundos = Number(body.duracion_segundos ?? body.duracion ?? 0) || 0;

    const res = await registrarEventoServidor({
      visitante,
      usuario_nombre: usuarioNombre,
      slug,
      tipo,
      producto,
      duracion_segundos: duracionSegundos,
    });

    return NextResponse.json(res, { status: 201 });
  } catch (err) {
    console.error("Error registrando evento de telemetría:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
