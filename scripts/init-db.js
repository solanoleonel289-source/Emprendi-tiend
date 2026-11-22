import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import pg from "pg";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

const { Pool } = pg;

const rawConnectionString = process.env.DATABASE_URL;

if (!rawConnectionString) {
  console.error("❌ Error: DATABASE_URL no está definida en .env ni .env.local");
  process.exit(1);
}

let cleanConnectionString = rawConnectionString;
let isLocalhost = false;

try {
  const url = new URL(rawConnectionString);
  isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  url.searchParams.delete("sslmode");
  cleanConnectionString = url.toString();
} catch (e) {
  isLocalhost =
    rawConnectionString.includes("localhost") ||
    rawConnectionString.includes("127.0.0.1");
}

const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: isLocalhost ? false : { rejectUnauthorized: false },
});

const ORDER = [
  "public.negocios",
  "negocios",
  "public.opiniones",
  "opiniones",
  "public.reportes",
  "reportes",
  "public.solicitudes",
  "solicitudes",
  "public.eventos",
  "eventos",
];

async function main() {
  console.log("🚀 Conectando a PostgreSQL para inicializar base de datos...");
  const client = await pool.connect();

  try {
    const sqlPath = path.resolve(process.cwd(), "database.sql");
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`No se encontró el archivo database.sql en ${sqlPath}`);
    }

    console.log("📄 Leyendo database.sql...");
    const rawSql = fs.readFileSync(sqlPath, "utf-8");

    const lines = rawSql.split("\n");
    const sanitizedLines = [];
    let skippingCopy = false;
    const copyBlocks = [];
    let currentCopy = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("\\restrict") || trimmed.startsWith("\\unrestrict")) {
        continue;
      }

      if (trimmed.startsWith("COPY ") && trimmed.includes("FROM stdin;")) {
        skippingCopy = true;
        const match = trimmed.match(/COPY\s+([a-zA-Z0-9_.]+)\s*\(([^)]+)\)\s+FROM\s+stdin;/i);
        if (match) {
          currentCopy = {
            table: match[1],
            columns: match[2].split(",").map((c) => c.trim()),
            rows: [],
          };
        }
        continue;
      }

      if (skippingCopy) {
        if (trimmed === "\\.") {
          skippingCopy = false;
          if (currentCopy) {
            copyBlocks.push(currentCopy);
            currentCopy = null;
          }
        } else if (currentCopy && trimmed !== "") {
          currentCopy.rows.push(line);
        }
        continue;
      }

      sanitizedLines.push(line);
    }

    const cleanSql = sanitizedLines.join("\n");

    console.log("⚙️  Ejecutando esquemas, tablas, secuencias y llaves...");
    await client.query("SET client_min_messages = warning;");
    await client.query(cleanSql);

    copyBlocks.sort((a, b) => {
      const indexA = ORDER.indexOf(a.table);
      const indexB = ORDER.indexOf(b.table);
      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
    });

    try {
      await client.query("SET session_replication_role = 'replica';");
    } catch (e) {
      
    }

    console.log(`📥 Insertando datos de ${copyBlocks.length} tablas...`);
    for (const block of copyBlocks) {
      console.log(`   - Cargando datos en ${block.table} (${block.rows.length} registros)...`);
      for (const row of block.rows) {
        const values = row.split("\t").map((val) => {
          if (val === "\\N" || val === "") return null;
          if (val === "t") return true;
          if (val === "f") return false;
          return val;
        });

        const placeholders = values.map((_, idx) => `$${idx + 1}`).join(", ");
        const colNames = block.columns.map((c) => `"${c}"`).join(", ");

        const insertQuery = `
          INSERT INTO ${block.table} (${colNames})
          VALUES (${placeholders})
          ON CONFLICT DO NOTHING
        `;

        await client.query(insertQuery, values);
      }
    }

    try {
      await client.query("SET session_replication_role = 'origin';");
    } catch (e) {}

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nombre VARCHAR(100),
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultimo_login TIMESTAMP
      )
    `);

    await client.query("SET search_path = public;");

    console.log("✅ ¡Base de datos inicializada y sincronizada con éxito en PostgreSQL!");
  } catch (err) {
    console.error("❌ Error inicializando base de datos:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
