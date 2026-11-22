import { NextResponse } from "next/server";
import { obtenerOpinionesAprobadas } from "@/lib/db";

export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    const opiniones = await obtenerOpinionesAprobadas(slug);
    return NextResponse.json(opiniones);
  } catch (err) {
    console.error("Error al obtener opiniones:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
