"use client";

import React, { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import {
  registrarEvento,
  getIdVisitante,
  usePageTimeTracker,
  iniciarMedicionProducto,
} from "@/lib/visitor";

const estrellas = (n) => "★".repeat(Math.max(0, Math.min(5, Number(n) || 0))) + "☆".repeat(Math.max(0, 5 - (Number(n) || 0)));

function textoPromedio(opiniones) {
  if (!opiniones.length) return "Aún sin opiniones";
  const suma = opiniones.reduce((total, o) => total + Number(o.puntos || 0), 0);
  const media = (suma / opiniones.length).toFixed(1).replace(".", ",");
  const palabra = opiniones.length === 1 ? "Opinión" : "Opiniones";
  return "★ " + media + " de 5 (" + opiniones.length + " " + palabra + ")";
}

export default function TiendaPage({ params }) {
  const { slug } = use(params);
  const { addToCart } = useCart();

  const [negocio, setNegocio] = useState(null);
  const [opiniones, setOpiniones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [opNombre, setOpNombre] = useState("");
  const [opPuntos, setOpPuntos] = useState("5");
  const [opCompra, setOpCompra] = useState("si");
  const [opComentario, setOpComentario] = useState("");
  const [avisoOpinion, setAvisoOpinion] = useState(null);

  const [repMotivo, setRepMotivo] = useState("");
  const [repDetalle, setRepDetalle] = useState("");
  const [avisoReporte, setAvisoReporte] = useState(null);
  const [recomendados, setRecomendados] = useState([]);

  // Telemetría de tiempo continuo en la tienda / pestaña
  usePageTimeTracker(slug, negocio?.nombre || slug);
  const cardTimers = useRef({});

  const cargarDatos = async () => {
    try {
      const visitanteId = getIdVisitante();
      const [resNegocio, resOpiniones, resRecs] = await Promise.all([
        fetch(`/api/negocios/${slug}`),
        fetch(`/api/negocios/${slug}/opiniones`),
        visitanteId ? fetch(`/api/recomendaciones?visitante=${encodeURIComponent(visitanteId)}&limite=3`) : Promise.resolve(null),
      ]);

      if (resNegocio.ok) {
        const dataN = await resNegocio.json();
        setNegocio(dataN);
      }

      if (resOpiniones.ok) {
        const dataO = await resOpiniones.json();
        setOpiniones(dataO);
      }

      if (resRecs && resRecs.ok) {
        const dataR = await resRecs.json();
        if (dataR && Array.isArray(dataR.productos)) {
          // Filtrar los que no sean de este mismo negocio o que complementen
          setRecomendados(dataR.productos);
        }
      }

      registrarEvento(slug, "ficha");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [slug]);

  const handleSubmitOpinion = async (e) => {
    e.preventDefault();
    setAvisoOpinion(null);

    try {
      const res = await fetch("/api/opiniones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          nombre: opNombre,
          puntos: opPuntos,
          compra: opCompra,
          comentario: opComentario,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");

      setAvisoOpinion({
        tipo: "ok",
        texto: data.mensaje || "¡Gracias! Tu opinión se ha publicado.",
      });

      // Añadir la opinión al estado inmediatamente
      if (data.opinion) {
        setOpiniones((prev) => [data.opinion, ...prev]);
      } else {
        setOpiniones((prev) => [
          {
            id: Date.now(),
            nombre: opNombre,
            puntos: Number(opPuntos),
            compra_confirmada: opCompra === "si",
            comentario: opComentario,
          },
          ...prev,
        ]);
      }

      setOpNombre("");
      setOpComentario("");
    } catch (err) {
      setAvisoOpinion({
        tipo: "error",
        texto: "No pudimos enviar el formulario. Inténtalo de nuevo en unos minutos.",
      });
    }
  };

  const handleSubmitReporte = async (e) => {
    e.preventDefault();
    setAvisoReporte(null);

    try {
      const res = await fetch("/api/reportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          motivo: repMotivo,
          detalle: repDetalle,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");

      setAvisoReporte({
        tipo: "ok",
        texto: "Recibimos tu reporte. Revisaremos el caso con cuidado.",
      });
      setRepMotivo("");
      setRepDetalle("");
    } catch (err) {
      setAvisoReporte({
        tipo: "error",
        texto: "No pudimos enviar el formulario. Inténtalo de nuevo en unos minutos.",
      });
    }
  };

  const handleAddToCart = (prod) => {
    const tiendaDestino = prod.tiendaSlug || slug;
    registrarEvento(tiendaDestino, "producto", prod.nombre);
    addToCart({
      nombre: prod.nombre,
      precio: prod.precio,
      imagen: prod.imagen,
      slug: tiendaDestino,
    });
    alert(`¡${prod.nombre} añadido al pedido!`);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "60px 20px" }}>
        <h3>Cargando...</h3>
      </div>
    );
  }

  if (!negocio) {
    return (
      <div className="container" style={{ padding: "60px 20px" }}>
        <h3>Emprendimiento no encontrado</h3>
        <br />
        <Link href="/cliente" className="btn btn-client">
          Volver al Catálogo
        </Link>
      </div>
    );
  }

  const whatsappMessage = encodeURIComponent(
    `Hola ${negocio.nombre}, vi tu tienda en EMPRENDITIENDA y quisiera hacer una consulta sobre tus productos.`
  );
  const whatsappUrl = `https://wa.me/${negocio.whatsapp || "51944403086"}?text=${whatsappMessage}`;

  return (
    <>
      <header className="main-header">
        <h1>{negocio.nombre}</h1>
        <h2>
          {negocio.categoria} en {negocio.ciudad} | {negocio.nivel}
        </h2>
      </header>

      <main className="puma-store-container">
        <section className="store-hero">
          <div className="store-hero-image">
            <img src={negocio.imagenHero || "/EmprendiTienda.jpg"} alt={negocio.nombre} />
          </div>
          <div className="store-about-box">
            <h3>Sobre el negocio</h3>
            <p className="intro-text">{negocio.descripcion}</p>
            <div className="logistica-list">
              <div className="logistica-item">
                <strong>Ciudad:</strong> {negocio.ciudad}
              </div>
              <div className="logistica-item">
                <strong>Horario:</strong> {negocio.horario || "Lunes a sábado"}
              </div>
              <div className="logistica-item">
                <strong>Preparación:</strong> {negocio.preparacion || "Coordinación directa"}
              </div>
              <div className="logistica-item">
                <strong>Despacho:</strong> {negocio.despacho || "Por agencia o delivery"}
              </div>
            </div>
          </div>
        </section>

        <section className="products-section-puma">
          <h3>Productos en Exhibición</h3>
          <div className="shops-grid">
            {negocio.productos && negocio.productos.map((prod) => (
              <div
                className="shop-card"
                key={prod.id || prod.nombre}
                onMouseEnter={() => {
                  cardTimers.current[prod.nombre] = iniciarMedicionProducto(slug, prod.nombre);
                }}
                onMouseLeave={() => {
                  if (cardTimers.current[prod.nombre]) {
                    cardTimers.current[prod.nombre]();
                    delete cardTimers.current[prod.nombre];
                  }
                }}
              >
                <div className="shop-image-container">
                  <img src={prod.imagen} alt={prod.nombre} />
                </div>
                <div className="shop-content-box">
                  <h4>{prod.nombre}</h4>
                  <p className="shop-category">{prod.categoria}</p>
                  <p className="shop-description">Precio de referencia: S/ {prod.precio}</p>
                  <button
                    type="button"
                    className="btn btn-client"
                    onClick={() => handleAddToCart(prod)}
                  >
                    Añadir al Pedido
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {recomendados && recomendados.length > 0 && (
          <section className="products-section-puma" style={{ marginTop: "40px", marginBottom: "50px" }}>
            <h3 style={{ textTransform: "uppercase", fontSize: "1.6rem", textAlign: "center" }}>
              💡 Recomendados para ti (según tus intereses)
            </h3>
            <div
              className="shops-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 340px))",
                justifyContent: "center",
                gap: "25px",
                maxWidth: "1200px",
                margin: "30px auto 0 auto",
              }}
            >
              {recomendados.map((prod) => (
                <div
                  className="shop-card"
                  key={prod.id || prod.nombre}
                  style={{ width: "100%", maxWidth: "340px", minWidth: "unset", margin: "0 auto" }}
                  onMouseEnter={() => {
                    cardTimers.current[prod.nombre] = iniciarMedicionProducto(prod.tiendaSlug || slug, prod.nombre);
                  }}
                  onMouseLeave={() => {
                    if (cardTimers.current[prod.nombre]) {
                      cardTimers.current[prod.nombre]();
                      delete cardTimers.current[prod.nombre];
                    }
                  }}
                >
                  <div className="shop-image-container">
                    <img src={prod.imagen} alt={prod.nombre} />
                  </div>
                  <div className="shop-content-box">
                    <h4>{prod.nombre}</h4>
                    <p className="shop-category">{prod.categoriaNegocio} · S/ {prod.precio}</p>
                    <p className="shop-description">💡 {prod.razon}</p>
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <button
                        type="button"
                        className="btn btn-client"
                        style={{ flex: 1, padding: "8px", fontSize: "11px" }}
                        onClick={() => handleAddToCart(prod)}
                      >
                        Añadir al Pedido
                      </button>
                      {prod.tiendaSlug !== slug && (
                        <Link
                          href={`/tienda/${prod.tiendaSlug}`}
                          className="btn btn-entrepreneur"
                          style={{ padding: "8px 12px", fontSize: "11px" }}
                        >
                          Ver Tienda
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="selection-box contact-store-box">
          <h3>Contactar al Vendedor</h3>
          <p className="question">Antes de escribir, ten en cuenta:</p>
          <ul className="puma-list">
            <li>Pide fotos o un video del producto actual.</li>
            <li>Desconfía de precios muy bajos o de quien te apure.</li>
            <li>Prefiere pagar contra entrega o recoger en agencia.</li>
            <li>No compartas claves ni códigos de seguridad.</li>
          </ul>
          <br />
          <a
            id="btn-contactar"
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-client"
            style={{ width: "100%" }}
          >
            Escribir por WhatsApp
          </a>
        </section>

        <section className="opinions-section">
          <h3>Opiniones y Puntuación</h3>
          <p className="question">{textoPromedio(opiniones)}</p>
          <div className="benefits-grid">
            {opiniones.length === 0 ? (
              <p>Este negocio aún no tiene opiniones.</p>
            ) : (
              opiniones.map((o) => (
                <div className="benefit-card" key={o.id}>
                  <h4>
                    {estrellas(o.puntos)} {o.nombre}
                  </h4>
                  <p className="shop-category">
                    {o.compra_confirmada ? "Compra confirmada" : "Compra sin confirmar"}
                  </p>
                  <p>{o.comentario}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="leave-opinion-section">
          <h3>Deja tu opinión</h3>
          <form id="form-opinion" onSubmit={handleSubmitOpinion}>
            <label htmlFor="op-nombre">Tu nombre</label>
            <input
              type="text"
              id="op-nombre"
              name="nombre"
              required
              value={opNombre}
              onChange={(e) => setOpNombre(e.target.value)}
            />

            <label htmlFor="op-puntos">Puntuación</label>
            <select
              id="op-puntos"
              name="puntos"
              required
              value={opPuntos}
              onChange={(e) => setOpPuntos(e.target.value)}
            >
              <option value="">Elige una puntuación</option>
              <option value="5">5 - Excelente</option>
              <option value="4">4 - Muy bueno</option>
              <option value="3">3 - Regular</option>
              <option value="2">2 - Malo</option>
              <option value="1">1 - Muy malo</option>
              <option value="0">0 - Pesimo</option>
            </select>

            <fieldset>
              <legend>¿Concretaste la compra?</legend>
              <input
                type="radio"
                name="compra"
                id="compra-si"
                value="si"
                checked={opCompra === "si"}
                onChange={() => setOpCompra("si")}
                required
              />
              <label htmlFor="compra-si">Sí</label>
              <input
                type="radio"
                name="compra"
                id="compra-no"
                value="no"
                checked={opCompra === "no"}
                onChange={() => setOpCompra("no")}
              />
              <label htmlFor="compra-no">No</label>
            </fieldset>

            <label htmlFor="op-texto">Tu comentario</label>
            <textarea
              id="op-texto"
              name="comentario"
              rows={4}
              required
              value={opComentario}
              onChange={(e) => setOpComentario(e.target.value)}
            ></textarea>

            <button type="submit">Publicar opinión</button>
          </form>

          {avisoOpinion && (
            <p
              className={`aviso-form ${avisoOpinion.tipo === "error" ? "error" : "ok"}`}
              style={{
                marginTop: "15px",
                fontWeight: "bold",
                color: avisoOpinion.tipo === "error" ? "red" : "#00cd6b",
              }}
            >
              {avisoOpinion.texto}
            </p>
          )}
        </section>
      </main>

      <footer className="horizontal-footer-form">
        <div className="footer-form-container">
          <h3>Reportar a este Vendedor</h3>
          <p className="intro-text">
            Cuéntanos qué pasó. Revisaremos el caso bajo estrictas normas de seguridad.
          </p>
          <form id="form-reporte" onSubmit={handleSubmitReporte} className="contact-form-horizontal">
            <div className="form-group-horizontal">
              <label htmlFor="rep-motivo">Motivo:</label>
              <select
                id="rep-motivo"
                name="motivo"
                required
                value={repMotivo}
                onChange={(e) => setRepMotivo(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "#111",
                  color: "#fff",
                  border: "2px solid #555",
                }}
              >
                <option value="">Elige un motivo</option>
                <option>Pedí un pago y no entregó</option>
                <option>Producto no era el publicado</option>
                <option>Datos falsos</option>
              </select>
            </div>
            <div className="form-group-horizontal text-area-field">
              <label htmlFor="rep-detalle">¿Qué pasó?:</label>
              <input
                type="text"
                id="rep-detalle"
                name="detalle"
                placeholder="Detalla la situación brevemente"
                required
                value={repDetalle}
                onChange={(e) => setRepDetalle(e.target.value)}
              />
            </div>
            <div className="form-group-horizontal btn-field">
              <button type="submit" className="btn">
                Enviar Reporte
              </button>
            </div>
          </form>

          {avisoReporte && (
            <p
              className={`aviso-form ${avisoReporte.tipo === "error" ? "error" : "ok"}`}
              style={{
                marginTop: "15px",
                fontWeight: "bold",
                color: avisoReporte.tipo === "error" ? "red" : "#00cd6b",
              }}
            >
              {avisoReporte.texto}
            </p>
          )}
        </div>
      </footer>
    </>
  );
}
