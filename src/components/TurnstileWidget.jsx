"use client";

import React, { useEffect, useRef, useState } from "react";

export function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  resetTrigger = 0,
  theme = "light",
  size = "normal",
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const siteKey =
    process.env.NEXT_PUBLIC_CF_SITE_KEY ||
    "3x00000000000000000000FF";

  // 1. Cargar el script de Cloudflare Turnstile si aún no está presente
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.turnstile) {
      setScriptLoaded(true);
      return;
    }

    const scriptId = "cf-turnstile-script";
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setScriptLoaded(true);
      };

      script.onerror = () => {
        setLoadError("No se pudo cargar el servicio de Cloudflare Turnstile. Verifica tu conexión.");
        if (onError) onError("script_load_error");
      };

      document.head.appendChild(script);
    } else {
      // El script ya está en el DOM, verificar periódicamente hasta que esté listo
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval);
          setScriptLoaded(true);
        }
      }, 50);

      return () => clearInterval(checkInterval);
    }
  }, [onError]);

  // 2. Renderizar el widget una vez que el script y el contenedor estén listos
  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.turnstile) return;

    let isSubscribed = true;

    try {
      // Si existía un widget previo en este contenedor, removerlo limpiamente
      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }

      containerRef.current.innerHTML = "";

      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: theme,
        size: size,
        action: "soy_cliente_access",
        callback: (token) => {
          if (isSubscribed && onVerify) {
            onVerify(token);
          }
        },
        "error-callback": (errorCode) => {
          console.warn("Turnstile error:", errorCode);
          if (isSubscribed && onError) {
            onError(errorCode);
          }
        },
        "expired-callback": () => {
          console.warn("Turnstile token expirado");
          if (isSubscribed && onExpire) {
            onExpire();
          }
        },
      });

      widgetIdRef.current = widgetId;
    } catch (err) {
      console.error("Error al renderizar Turnstile:", err);
      setLoadError("Error al inicializar la verificación.");
    }

    return () => {
      isSubscribed = false;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [scriptLoaded, siteKey, theme, size, resetTrigger]);

  if (loadError) {
    return (
      <div style={{ color: "#dc2626", fontSize: "0.85rem", padding: "8px 0" }}>
        ⚠️ {loadError}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "65px",
        width: "100%",
      }}
    >
      <div ref={containerRef} />
      {!scriptLoaded && (
        <div style={{ color: "#666", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <span>Iniciando verificación de seguridad de Cloudflare...</span>
        </div>
      )}
    </div>
  );
}
export default TurnstileWidget;
