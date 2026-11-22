import { NextResponse } from "next/server";
import { obtenerSugerencias } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const visitante = searchParams.get("visitante") || "";

    const visitanteLimpio = typeof visitante === "string" ? visitante.trim().slice(0, 80) : "";

    const sugerencias = await obtenerSugerencias(visitanteLimpio);
    return NextResponse.json(sugerencias);
  } catch (err) {
    console.error("Error obteniendo sugerencias:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
