import { NextResponse } from "next/server";
import { obtenerSugerencias } from "@/lib/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const visitante = searchParams.get("visitante") || "";

    if (!visitante || !/^[A-Za-z0-9-]{10,64}$/.test(visitante)) {
      return NextResponse.json({ error: "Visitante no válido" }, { status: 400 });
    }

    const sugerencias = await obtenerSugerencias(visitante);
    return NextResponse.json(sugerencias);
  } catch (err) {
    console.error("Error obteniendo sugerencias:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
