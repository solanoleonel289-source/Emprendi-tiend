import { NextResponse } from "next/server";
import { validarCredenciales, crearSessionToken } from "@/lib/admin-auth";

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { error: "Debe ingresar usuario y contraseña" },
        { status: 400 }
      );
    }

    const admin = await validarCredenciales(username, password);
    if (!admin) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const token = crearSessionToken(admin);

    const response = NextResponse.json({
      ok: true,
      user: {
        username: admin.username,
        nombre: admin.nombre,
      },
    });

    response.cookies.set({
      name: "admin_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Error en login de admin:", err);
    return NextResponse.json(
      { error: "Error interno del servidor al autenticar" },
      { status: 500 }
    );
  }
}
