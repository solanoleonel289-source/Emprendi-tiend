import { NextResponse } from "next/server";
import { minarRecomendacionesProductos } from "@/lib/mining";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const visitante = searchParams.get("visitante") || "";
    const limite = Number(searchParams.get("limite")) || 4;

    const data = await minarRecomendacionesProductos(visitante, limite);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error obteniendo recomendaciones minadas:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
