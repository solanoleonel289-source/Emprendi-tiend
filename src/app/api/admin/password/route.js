import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerAdminDeRequest, verifyPassword, hashPassword } from "@/lib/admin-auth";

export async function PATCH(req) {
  const adminSession = obtenerAdminDeRequest(req);
  if (!adminSession) {
    return NextResponse.json(
      { error: "No autorizado. Inicie sesión para cambiar la contraseña." },
      { status: 401 }
    );
  }

  try {
    const { passwordActual, passwordNueva } = await req.json();

    if (!passwordActual || !passwordNueva) {
      return NextResponse.json(
        { error: "Debe ingresar la contraseña actual y la nueva contraseña" },
        { status: 400 }
      );
    }

    if (passwordNueva.trim().length < 6) {
      return NextResponse.json(
        { error: "La nueva contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    // Buscar usuario en base de datos
    const { rows } = await query(
      "SELECT id, username, password_hash FROM admin_usuarios WHERE username = $1",
      [adminSession.username]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario administrador no encontrado en la base de datos" },
        { status: 404 }
      );
    }

    const admin = rows[0];
    if (!verifyPassword(passwordActual.trim(), admin.password_hash)) {
      return NextResponse.json(
        { error: "La contraseña actual no es correcta" },
        { status: 400 }
      );
    }

    const nuevoHash = hashPassword(passwordNueva.trim());
    await query("UPDATE admin_usuarios SET password_hash = $1 WHERE id = $2", [
      nuevoHash,
      admin.id,
    ]);

    return NextResponse.json({
      ok: true,
      mensaje: "Contraseña actualizada exitosamente",
    });
  } catch (err) {
    console.error("Error cambiando contraseña de admin:", err);
    return NextResponse.json(
      { error: "Error interno al actualizar contraseña" },
      { status: 500 }
    );
  }
}
