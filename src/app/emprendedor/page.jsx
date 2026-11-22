"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function EmprendedorPage() {
  const [nombre, setNombre] = useState("");
  const [tienda, setTienda] = useState("");
  const [correo, setCorreo] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [mensajeTexto, setMensajeTexto] = useState("");
  const [aviso, setAviso] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAviso(null);

    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          tienda,
          correo,
          whatsapp,
          mensaje: mensajeTexto,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar");

      setAviso({
        tipo: "ok",
        texto: "Recibimos tu solicitud. Revisaremos tus datos y te escribiremos.",
      });

      setNombre("");
      setTienda("");
      setCorreo("");
      setWhatsapp("");
      setMensajeTexto("");
    } catch (err) {
      setAviso({
        tipo: "error",
        texto: "No pudimos enviar el formulario. Inténtalo de nuevo en unos minutos.",
      });
    }
  };

  return (
    <>
      <header className="main-header">
        <img src="/EmprendiTienda.jpg" alt="Logo de Emprendi-Tienda" className="logo-header" />
        <h1>Portal de Emprendedores</h1>
        <h2>Impulsa tu negocio y llega a miles de clientes</h2>
      </header>

      <main className="container">
        <section className="benefits-section">
          <h3>Beneficios de Vender con Nosotros</h3>
          <p className="intro-text">
            Al unirte a nuestra comunidad obtendrás todas las herramientas necesarias para digitalizar tu negocio de forma segura.
          </p>

          <div className="benefits-grid">
            <div className="benefit-card">
              <h4>🔒 Entorno Seguro</h4>
              <p>
                Ofrecemos máxima seguridad, respaldo y confianza tanto para ti como para cada uno de tus futuros clientes.
              </p>
            </div>
            <div className="benefit-card">
              <h4>🚀 Mayor Visibilidad</h4>
              <p>
                Posiciona tus productos frente a una comunidad activa de compradores interesados en el comercio local.
              </p>
            </div>
            <div className="benefit-card">
              <h4>📈 Soporte Digital</h4>
              <p>
                Herramientas sencillas e intuitivas para gestionar tus solicitudes, stock y canales de comunicación sin complicaciones.
              </p>
            </div>
          </div>
        </section>

        <Link
          href="/"
          className="btn btn-entrepreneur"
          style={{ marginBottom: "60px" }}
        >
          Volver al Inicio
        </Link>
      </main>

      <footer className="horizontal-footer-form">
        <div className="footer-form-container">
          <h3>Formulario de Registro y Contacto</h3>
          <p className="intro-text">
            Completa tus datos para dar de alta tu tienda en nuestra plataforma.
          </p>

          <form id="form-registro" onSubmit={handleSubmit} className="contact-form-horizontal">
            <div className="form-group-horizontal">
              <label htmlFor="nombre">Nombre:</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                placeholder="Tu nombre"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="form-group-horizontal">
              <label htmlFor="tienda">Emprendimiento:</label>
              <input
                type="text"
                id="tienda"
                name="tienda"
                placeholder="Nombre de tu tienda"
                required
                value={tienda}
                onChange={(e) => setTienda(e.target.value)}
              />
            </div>

            <div className="form-group-horizontal">
              <label htmlFor="correo">Correo:</label>
              <input
                type="email"
                id="correo"
                name="correo"
                placeholder="ejemplo@correo.com"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>

            <div className="form-group-horizontal">
              <label htmlFor="whatsapp">WhatsApp:</label>
              <input
                type="tel"
                id="whatsapp"
                name="whatsapp"
                placeholder="Ej. +51 987654321"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
              />
            </div>

            <div className="form-group-horizontal text-area-field">
              <label htmlFor="mensaje">Productos:</label>
              <input
                type="text"
                id="mensaje"
                name="mensaje"
                placeholder="¿Qué productos ofreces?"
                required
                value={mensajeTexto}
                onChange={(e) => setMensajeTexto(e.target.value)}
              />
            </div>

            <div className="form-group-horizontal btn-field">
              <button type="submit" className="btn btn-client">
                Enviar
              </button>
            </div>
          </form>

          {aviso && (
            <p
              className={`aviso-form ${aviso.tipo === "error" ? "error" : "ok"}`}
              style={{
                marginTop: "15px",
                fontWeight: "bold",
                color: aviso.tipo === "error" ? "red" : "#00cd6b",
              }}
            >
              {aviso.texto}
            </p>
          )}
        </div>
      </footer>
    </>
  );
}
