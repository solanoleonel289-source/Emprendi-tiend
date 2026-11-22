import { NextResponse } from "next/server";
import { obtenerNegocioPorSlug } from "@/lib/db";

export async function GET(_request, { params }) {
  try {
    const { slug } = await params;
    const negocio = await obtenerNegocioPorSlug(slug);

    if (!negocio) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(negocio);
  } catch (err) {
    console.error("Error al obtener detalle del negocio:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
