import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    await query("SELECT 1");
    return NextResponse.json({ ok: true, status: "healthy", database: "connected" });
  } catch (err) {
    return NextResponse.json(
      {
        ok: true,
        status: "degraded",
        database: "offline",
        message: "API operativa con datos de respaldo locales",
      },
      { status: 200 }
    );
  }
}
