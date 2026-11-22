"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import {
  getIdVisitante,
  isSeguimientoActivo,
  desactivarSeguimiento,
  registrarEvento,
  usePageTimeTracker,
  iniciarMedicionProducto,
} from "@/lib/visitor";

/**
 * Pantalla de verificación previa con Cloudflare Turnstile CAPTCHA.
 * Se muestra siempre que el usuario entra al apartado de Soy Cliente.
 */
function ClienteSecurityGate({
  onVerify,
  isVerifying,
  errorMessage,
  resetTrigger,
}) {
  return (
    <>
      <header className="main-header">
        <img
          src="/EmprendiTienda.jpg"
          alt="Logo de Emprendi-Tienda"
          style={{
            width: "90px",
            height: "auto",
            borderRadius: "8px",
            marginBottom: "15px",
          }}
        />
        <h1>Acceso a Clientes</h1>
        <h2>Verificación de Seguridad Cloudflare</h2>
      </header>

      <main
        className="container"
        style={{
          maxWidth: "560px",
          margin: "40px auto 80px auto",
          padding: "0 20px",
        }}
      >
        <section
          className="selection-box"
          style={{
            backgroundColor: "#ffffff",
            border: "3px solid #000000",
            boxShadow: "8px 8px 0px #000000",
            padding: "40px 30px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background: "#000000",
              color: "#00cd6b",
              margin: "0 auto 20px auto",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <ShieldCheck size={38} strokeWidth={2.2} />
          </div>

          <h3
            style={{
              textTransform: "uppercase",
              fontSize: "1.6rem",
              fontWeight: 900,
              color: "#000000",
              marginBottom: "10px",
              letterSpacing: "0.5px",
            }}
          >
            Apartado: Soy Cliente
          </h3>

          <p
            className="intro-text"
            style={{
              fontSize: "0.95rem",
              color: "#4b5563",
              marginBottom: "25px",
              lineHeight: 1.5,
            }}
          >
            Para proteger nuestra plataforma y a los emprendedores locales contra accesos automatizados, completa la verificación de Cloudflare antes de ingresar al catálogo.
          </p>

          <div
            style={{
              margin: "25px 0",
              padding: "16px",
              background: "#f9fafb",
              border: "1px dashed #d1d5db",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "85px",
            }}
          >
            <TurnstileWidget
              onVerify={onVerify}
              onError={() => {}}
              onExpire={() => {}}
              resetTrigger={resetTrigger}
            />
          </div>

          {isVerifying && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                margin: "15px 0",
                fontSize: "0.9rem",
                color: "#000000",
                fontWeight: "bold",
              }}
            >
              <RefreshCw className="animate-spin" size={18} />
              <span>Validando respuesta con Cloudflare...</span>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                margin: "15px 0",
                padding: "12px",
                background: "#fef2f2",
                border: "2px solid #ef4444",
                borderRadius: "6px",
                color: "#991b1b",
                fontSize: "0.85rem",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>⚠️ {errorMessage}</span>
            </div>
          )}

          <div
            style={{
              marginTop: "30px",
              borderTop: "2px solid #e5e7eb",
              paddingTop: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Protegido por Cloudflare Turnstile
            </span>
            <Link
              href="/"
              className="btn btn-entrepreneur"
              style={{
                margin: "5px 0 0 0",
                padding: "10px 24px",
                fontSize: "0.8rem",
              }}
            >
              ← Volver al Inicio
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

/**
 * Contenido protegido del catálogo de clientes.
 * Sólo se monta y ejecuta una vez superado el CAPTCHA.
 */
function ClienteCatalog() {
  const searchParams = useSearchParams();
  const searchParamQuery = searchParams.get("buscar") || "";
  const categoryParam = searchParams.get("categoria") || "todos";

  const { addToCart } = useCart();

  const [negocios, setNegocios] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [recomendaciones, setRecomendaciones] = useState({
    perfil: null,
    productos: [],
    esPersonalizado: false,
  });
  const [trackingActive, setTrackingActive] = useState(true);

  // Telemetría de tiempo continuo en la pestaña de cliente
  usePageTimeTracker("general", "Catálogo Cliente");
  const cardTimers = useRef({});

  // Cargar tiendas desde la API
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/negocios");
        if (res.ok) {
          const data = await res.json();
          setNegocios(data);
        }
      } catch (e) {
        console.error("Error cargando negocios:", e);
      }
    }
    loadData();
  }, []);

  // Telemetría de búsqueda activa
  useEffect(() => {
    if (searchParamQuery && isSeguimientoActivo()) {
      registrarEvento("general", "busqueda", searchParamQuery);
    }
  }, [searchParamQuery]);

  // Cargar sugerencias y recomendaciones de minería de datos
  useEffect(() => {
    const activo = isSeguimientoActivo();
    setTrackingActive(activo);
    if (!activo) return;

    const visitanteId = getIdVisitante();
    if (!visitanteId) return;

    // 1. Minería de productos según intereses
    fetch(`/api/recomendaciones?visitante=${encodeURIComponent(visitanteId)}&limite=4`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.productos)) {
          setRecomendaciones(data);
        }
      })
      .catch(() => {});

    // 2. Tiendas sugeridas
    fetch(`/api/sugerencias?visitante=${encodeURIComponent(visitanteId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setSugerencias(data);
        }
      })
      .catch(() => {});
  }, []);

  const handleDisableTracking = () => {
    desactivarSeguimiento();
    setTrackingActive(false);
    setSugerencias([]);
    setRecomendaciones({ perfil: null, productos: [], esPersonalizado: false });
  };

  const handleAddRecommendedToCart = (prod) => {
    registrarEvento(prod.tiendaSlug || "general", "producto", prod.nombre);
    addToCart({
      nombre: prod.nombre,
      precio: prod.precio,
      imagen: prod.imagen,
      slug: prod.tiendaSlug,
    });
    alert(`¡${prod.nombre} añadido al pedido!`);
  };

  const filteredNegocios = useMemo(() => {
    return negocios.filter((n) => {
      const q = searchParamQuery.toLowerCase().trim();
      const cat = categoryParam.toLowerCase().trim();

      const keywordsStr =
        (n.keywords ? n.keywords.join(" ") : "") +
        " " +
        n.nombre +
        " " +
        n.categoria +
        " " +
        n.ciudad;
      const lowerKeywords = keywordsStr.toLowerCase();

      const matchesSearch = !q || lowerKeywords.includes(q);
      const matchesCategory = cat === "todos" || lowerKeywords.includes(cat);

      return matchesSearch && matchesCategory;
    });
  }, [negocios, searchParamQuery, categoryParam]);

  const personalizado = sugerencias.some((n) => n.puntos > 0);

  return (
    <>
      <header className="main-header">
        <h1>Emprendimientos Sugeridos</h1>
        <h2>Descubre y apoya los negocios locales registrados en nuestra comunidad</h2>
      </header>

      <main className="container">
        {/* SECCIÓN DE MINERÍA DE DATOS Y RECOMENDACIÓN DE PRODUCTOS */}
        {trackingActive && recomendaciones?.productos?.length > 0 && (
          <section id="productos-recomendados" style={{ marginBottom: "50px", textAlign: "center", width: "100%" }}>
            <h3 style={{ textTransform: "uppercase", fontSize: "1.8rem" }}>
              {recomendaciones.esPersonalizado ? "🎯 Productos Recomendados para Ti" : "🔥 Artículos Más Solicitados"}
            </h3>
            <p className="intro-text" style={{ marginBottom: "15px" }}>
              {recomendaciones.esPersonalizado
                ? `Seleccionados según tu telemetría e intereses (${recomendaciones.perfil?.nivelIntencion || "Cliente frecuente"})`
                : "Tendencias basadas en la telemetría de compras de la comunidad"}
            </p>

            {/* Badges de intereses detectados */}
            {recomendaciones.perfil?.intereses?.length > 0 && (
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", alignItems: "center", marginBottom: "25px" }}>
                <span style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase" }}>
                  Tus Intereses:
                </span>
                {recomendaciones.perfil.intereses.map((item) => (
                  <span
                    key={item.categoria}
                    style={{
                      background: "#000000",
                      color: "#00cd6b",
                      padding: "5px 12px",
                      fontSize: "12px",
                      fontWeight: "900",
                      textTransform: "uppercase",
                      border: "2px solid #000000",
                    }}
                  >
                    {item.categoria}: {item.porcentaje}%
                  </span>
                ))}
              </div>
            )}

            {/* Cuadrícula organizada en varias columnas */}
            <div
              className="shops-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                justifyContent: "center",
                gap: "20px",
                maxWidth: "1200px",
                margin: "0 auto",
                width: "100%",
              }}
            >
              {recomendaciones.productos.map((prod) => (
                <div
                  className="shop-card"
                  key={prod.id || prod.nombre}
                  style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: "340px",
                    minWidth: "unset",
                    margin: "0 auto",
                  }}
                  onMouseEnter={() => {
                    cardTimers.current[prod.nombre] = iniciarMedicionProducto(prod.tiendaSlug || "general", prod.nombre);
                  }}
                  onMouseLeave={() => {
                    if (cardTimers.current[prod.nombre]) {
                      cardTimers.current[prod.nombre]();
                      delete cardTimers.current[prod.nombre];
                    }
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      left: "10px",
                      zIndex: 10,
                      background: "#00cd6b",
                      color: "#000000",
                      fontSize: "10px",
                      fontWeight: 900,
                      padding: "4px 8px",
                      border: "2px solid #000000",
                      textTransform: "uppercase",
                    }}
                  >
                    💡 {prod.razon}
                  </div>

                  <div className="shop-image-container">
                    <img src={prod.imagen} alt={prod.nombre} />
                  </div>

                  <div className="shop-content-box">
                    <h4>{prod.nombre}</h4>
                    <p className="shop-category">
                      {prod.categoriaNegocio} · S/ {prod.precio}
                    </p>
                    <p className="shop-description">
                      {prod.descripcion || `Vendido por ${prod.tiendaNombre}`}
                    </p>

                    <div style={{ display: "flex", gap: "8px", marginTop: "15px" }}>
                      <button
                        type="button"
                        className="btn btn-client"
                        style={{ flex: 1, padding: "10px", fontSize: "11px" }}
                        onClick={() => handleAddRecommendedToCart(prod)}
                      >
                        Añadir al Pedido
                      </button>
                      <Link
                        href={`/tienda/${prod.tiendaSlug}`}
                        className="btn btn-entrepreneur"
                        style={{ padding: "10px 14px", fontSize: "11px" }}
                      >
                        Ver Tienda
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECCIÓN DE TIENDAS SUGERIDAS */}
        {trackingActive && sugerencias.length > 0 && (
          <section id="sugerencias" style={{ marginBottom: "50px", width: "100%" }}>
            <h3 id="titulo-sugerencias">
              {personalizado ? "Tiendas Sugeridas para ti" : "Tiendas Más Visitadas"}
            </h3>
            <div
              id="lista-sugerencias"
              className="benefits-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                justifyContent: "center",
                gap: "20px",
                maxWidth: "1200px",
                margin: "0 auto",
                width: "100%",
              }}
            >
              {sugerencias.map((n) => (
                <div
                  key={n.slug}
                  className="benefit-card"
                  style={{ width: "100%", maxWidth: "340px", minWidth: "unset", margin: "0 auto" }}
                >
                  <h4>{n.nombre}</h4>
                  <p>
                    {n.categoria} | {n.ciudad}
                  </p>
                  <Link
                    href={`/tienda/${n.slug}`}
                    className="btn btn-client"
                    style={{ marginTop: "15px" }}
                  >
                    Visitar Tienda
                  </Link>
                </div>
              ))}
            </div>
            <p className="intro-text" style={{ marginTop: "20px" }}>
              Analizamos los negocios y productos que visitas para sugerirte lo más relevante mediante telemetría anónima. No guardamos tu nombre ni contraseñas.
            </p>
            <button
              type="button"
              id="btn-sin-seguimiento"
              className="btn btn-entrepreneur"
              onClick={handleDisableTracking}
            >
              Dejar de guardar mi actividad
            </button>
          </section>
        )}

        {/* CATÁLOGO COMPLETO DE TIENDAS */}
        <section
          className="shops-grid"
          id="shopsGrid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            justifyContent: "center",
            gap: "20px",
            marginTop: "30px",
            maxWidth: "1200px",
            margin: "30px auto 0 auto",
            width: "100%",
          }}
        >
          {filteredNegocios.map((shop) => (
            <div
              className="shop-card"
              key={shop.slug}
              data-keywords={shop.keywords ? shop.keywords.join(" ") : ""}
              style={{ width: "100%", maxWidth: "340px", minWidth: "unset", margin: "0 auto" }}
            >
              {shop.badge && <div className="shop-badge">{shop.badge}</div>}
              <div className="shop-image-container">
                <img src={shop.imagenHero || "/EmprendiTienda.jpg"} alt={shop.nombre} />
              </div>
              <div className="shop-content-box">
                <h4>{shop.nombre}</h4>
                <p className="shop-category">{shop.categoria}</p>
                <p className="shop-description">{shop.descripcion}</p>
                <Link href={`/tienda/${shop.slug}`} className="btn btn-client">
                  Visitar Tienda
                </Link>
              </div>
            </div>
          ))}
        </section>

        <br />
        <br />
        <Link href="/" className="btn btn-entrepreneur">
          Volver al Inicio
        </Link>
      </main>
    </>
  );
}

/**
 * Manejador principal de la página de cliente.
 * Cada vez que el usuario entra, isVerified inicia en false
 * y se le solicita la verificación de Cloudflare Turnstile.
 */
function ClientePageContent() {
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resetTrigger, setResetTrigger] = useState(0);

  const handleVerify = async (token) => {
    setIsVerifying(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/verify-turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setIsVerified(true);
      } else {
        setErrorMessage(
          data.error || "No se pudo validar el captcha. Inténtalo de nuevo."
        );
        setResetTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error validando Turnstile:", err);
      setErrorMessage("Error de conexión al verificar el captcha.");
      setResetTrigger((prev) => prev + 1);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isVerified) {
    return (
      <ClienteSecurityGate
        onVerify={handleVerify}
        isVerifying={isVerifying}
        errorMessage={errorMessage}
        resetTrigger={resetTrigger}
      />
    );
  }

  return <ClienteCatalog />;
}

export default function ClientePage() {
  return (
    <Suspense fallback={<div className="container">Cargando...</div>}>
      <ClientePageContent />
    </Suspense>
  );
}
