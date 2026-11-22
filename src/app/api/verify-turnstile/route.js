import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = body?.token;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "El token de Cloudflare Turnstile es requerido." },
        { status: 400 }
      );
    }

    const secretKey =
      process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
      "1x0000000000000000000000000000000AA";

    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : null;
    if (ip) {
      formData.append("remoteip", ip);
    }

    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!verifyRes.ok) {
      return NextResponse.json(
        { success: false, error: "Error al comunicarse con los servidores de Cloudflare." },
        { status: 502 }
      );
    }

    const outcome = await verifyRes.json();

    if (outcome.success) {
      return NextResponse.json({
        success: true,
        timestamp: outcome.challenge_ts,
      });
    } else {
      console.warn("Validación de Turnstile rechazada:", outcome["error-codes"]);
      return NextResponse.json(
        {
          success: false,
          error: "Verificación de seguridad no superada. Por favor, reintenta.",
          errorCodes: outcome["error-codes"] || [],
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error en verify-turnstile:", error);
    return NextResponse.json(
      { success: false, error: "Ocurrió un error interno al verificar el captcha." },
      { status: 500 }
    );
  }
}
