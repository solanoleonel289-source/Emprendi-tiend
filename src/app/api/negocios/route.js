import { NextResponse } from "next/server";
import { obtenerNegocios } from "@/lib/db";

export async function GET() {
  try {
    const negocios = await obtenerNegocios();
    return NextResponse.json(negocios);
  } catch (err) {
    console.error("Error obteniendo negocios:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
