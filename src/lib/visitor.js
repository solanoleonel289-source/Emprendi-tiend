import { useEffect } from "react";

export function getIdVisitante() {
  if (typeof window === "undefined") return "";

  try {
    let id = localStorage.getItem("idVisitante");
    if (!id) {
      id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Date.now().toString(36) + Math.random().toString(36).slice(2);
      localStorage.setItem("idVisitante", id);
    }
    return id;
  } catch (e) {
    return "anon-" + Date.now();
  }
}

export function isSeguimientoActivo() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("sinSeguimiento") !== "si";
  } catch (e) {
    return false;
  }
}

export function desactivarSeguimiento() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("sinSeguimiento", "si");
  } catch (e) {}
}

export function getNombreUsuarioLocal() {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem("usuarioEmprendiTienda");
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return parsed?.nombres || "";
  } catch (e) {
    return "";
  }
}

export async function registrarEvento(slug, tipo, producto, duracionSegundos = 0) {
  if (typeof window === "undefined" || !isSeguimientoActivo()) return;

  const duracion = Math.max(0, Math.round(Number(duracionSegundos) || 0));

  try {
    await fetch("/api/eventos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitante: getIdVisitante(),
        usuario_nombre: getNombreUsuarioLocal(),
        slug: slug || "general",
        tipo: tipo || "ficha",
        producto: producto || "",
        duracion_segundos: duracion,
      }),
    });
  } catch (err) {
    // Silently continue
  }
}

export function registrarTiempo(slug, productoOContexto, duracionSegundos) {
  if (typeof window === "undefined" || !isSeguimientoActivo()) return;

  const duracion = Math.max(0, Math.round(Number(duracionSegundos) || 0));
  if (duracion < 2) return; // Ignorar parpadeos menores a 2 segundos

  const payload = JSON.stringify({
    visitante: getIdVisitante(),
    usuario_nombre: getNombreUsuarioLocal(),
    slug: slug || "general",
    tipo: "tiempo",
    producto: productoOContexto || "permanencia",
    duracion_segundos: duracion,
  });

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/eventos", blob);
    } else {
      fetch("/api/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (e) {
    // Silently continue
  }
}

export function usePageTimeTracker(slug, nombrePestana) {
  useEffect(() => {
    if (typeof window === "undefined" || !isSeguimientoActivo()) return;

    let startTime = Date.now();
    let yaRegistrado = false;

    const flushTiempo = () => {
      if (yaRegistrado) return;
      const segundos = Math.round((Date.now() - startTime) / 1000);
      if (segundos >= 3) {
        yaRegistrado = true;
        registrarTiempo(slug || "general", nombrePestana || "Pestaña", segundos);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flushTiempo();
      } else {
        startTime = Date.now();
        yaRegistrado = false;
      }
    };

    window.addEventListener("beforeunload", flushTiempo);
    window.addEventListener("pagehide", flushTiempo);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      flushTiempo();
      window.removeEventListener("beforeunload", flushTiempo);
      window.removeEventListener("pagehide", flushTiempo);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [slug, nombrePestana]);
}

export function iniciarMedicionProducto(slug, nombreProducto) {
  if (typeof window === "undefined" || !isSeguimientoActivo() || !nombreProducto) {
    return () => {};
  }
  const inicio = Date.now();
  let registrado = false;

  return () => {
    if (registrado) return;
    registrado = true;
    const segundos = Math.round((Date.now() - inicio) / 1000);
    if (segundos >= 3) {
      registrarTiempo(slug || "general", nombreProducto, segundos);
    }
  };
}
