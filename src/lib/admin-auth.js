import crypto from "crypto";
import { query } from "./db.js";

const SECRET = process.env.ADMIN_SESSION_SECRET || "emprendi-tienda-admin-secret-key-2026";

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  try {
    const [salt, key] = storedHash.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

export async function asegurarAdminPorDefecto() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS admin_usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nombre VARCHAR(100),
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultimo_login TIMESTAMP
      )
    `);

    const { rows } = await query("SELECT id FROM admin_usuarios LIMIT 1");
    if (rows.length === 0) {
      const defaultUser = process.env.ADMIN_USER || "admin";
      const defaultPass = process.env.ADMIN_PASSWORD || "admin123";
      const passHash = hashPassword(defaultPass);
      await query(
        `INSERT INTO admin_usuarios (username, password_hash, nombre)
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO NOTHING`,
        [defaultUser, passHash, "Administrador Principal"]
      );
      console.log(`[Admin Auth] Usuario admin por defecto creado: ${defaultUser}`);
    }
  } catch (err) {
    console.warn("[Admin Auth] Advertencia al verificar admin_usuarios:", err.message);
  }
}

export async function validarCredenciales(username, password) {
  const userTrim = (username || "").trim();
  const passTrim = (password || "").trim();
  if (!userTrim || !passTrim) return null;

  try {
    await asegurarAdminPorDefecto();

    const { rows } = await query(
      "SELECT id, username, password_hash, nombre FROM admin_usuarios WHERE username = $1",
      [userTrim]
    );

    if (rows.length > 0) {
      const admin = rows[0];
      if (verifyPassword(passTrim, admin.password_hash)) {
        await query("UPDATE admin_usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = $1", [
          admin.id,
        ]).catch(() => {});
        return { username: admin.username, nombre: admin.nombre };
      }
    }
  } catch (err) {
    console.warn("[Admin Auth] Fallback de validación con DB:", err.message);
  }

  // Fallback con credenciales de entorno si la DB no responde o no está inicializada
  const envUser = process.env.ADMIN_USER || "admin";
  const envPass = process.env.ADMIN_PASSWORD || "admin123";
  if (userTrim === envUser && passTrim === envPass) {
    return { username: envUser, nombre: "Administrador (Env)" };
  }

  return null;
}

export function crearSessionToken(user) {
  const payload = {
    username: user.username,
    nombre: user.nombre || user.username,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 días
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
  return `${data}.${hmac}`;
}

export function verificarSessionToken(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  try {
    const expectedSignature = crypto.createHmac("sha256", SECRET).update(data).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function obtenerAdminDeRequest(req) {
  let token = req.cookies.get("admin_session")?.value;
  if (!token) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }
  return verificarSessionToken(token);
}
