import { NextResponse } from "next/server";
import { obtenerAdminDeRequest } from "@/lib/admin-auth";

export async function GET(req) {
  const admin = obtenerAdminDeRequest(req);
  if (!admin) {
    return NextResponse.json({ autenticado: false }, { status: 401 });
  }

  return NextResponse.json({
    autenticado: true,
    user: {
      username: admin.username,
      nombre: admin.nombre,
    },
  });
}
