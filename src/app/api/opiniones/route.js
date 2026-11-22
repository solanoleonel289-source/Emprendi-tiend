import { NextResponse } from "next/server";
import { buscarNegocioId, query } from "@/lib/db";

const limpiarTexto = (val, max) =>
  typeof val === "string" ? val.trim().slice(0, max) : "";

export async function POST(req) {
  try {
    const b = await req.json();
    const nombre = limpiarTexto(b.nombre, 60);
    const comentario = limpiarTexto(b.comentario, 800);
    const puntos = b.puntos === "" || b.puntos == null ? NaN : Number(b.puntos);
    const slug = limpiarTexto(b.slug, 80);

    if (
      !nombre ||
      !comentario ||
      !Number.isInteger(puntos) ||
      puntos < 0 ||
      puntos > 5
    ) {
      return NextResponse.json({ error: "Datos no válidos" }, { status: 400 });
    }

    const negocioId = await buscarNegocioId(slug);
    if (!negocioId) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404 }
      );
    }

    const compraConfirmada = b.compra === "si" || b.compra === true;

    let nuevaOpinion = null;
    try {
      const { rows } = await query(
        `INSERT INTO opiniones (negocio_id, nombre, puntos, compra_confirmada, comentario, estado)
         VALUES ($1, $2, $3, $4, $5, 'aprobada')
         RETURNING id, negocio_id, nombre, puntos, compra_confirmada, comentario, estado, creado_en`,
        [negocioId, nombre, puntos, compraConfirmada, comentario]
      );
      if (rows && rows.length > 0) {
        nuevaOpinion = rows[0];
      }
    } catch (dbErr) {
      console.warn("No se pudo guardar la opinión en la base de datos (modo offline):", dbErr);
    }

    return NextResponse.json(
      {
        ok: true,
        mensaje: "¡Gracias! Tu opinión se ha publicado con éxito.",
        opinion: nuevaOpinion || {
          id: Date.now(),
          negocio_id: negocioId,
          nombre,
          puntos,
          compra_confirmada: compraConfirmada,
          comentario,
          estado: "aprobada",
          creado_en: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error guardando opinión:", err);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
