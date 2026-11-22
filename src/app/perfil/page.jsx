"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";

const defaultAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Crect width='180' height='180' fill='%23222222'/%3E%3Ccircle cx='90' cy='68' r='34' fill='%23ffffff'/%3E%3Cpath d='M35 162 C35 120, 145 120, 145 162' fill='%23ffffff'/%3E%3C/svg%3E";

export default function PerfilPage() {
  const router = useRouter();
  const { cart } = useCart();

  const [usuario, setUsuario] = useState(null);
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotoPortada, setFotoPortada] = useState(null);
  const [activeTab, setActiveTab] = useState("pendientes");
  const [realizadas, setRealizadas] = useState([]);

  // Form if not logged in
  const [regNombres, setRegNombres] = useState("");
  const [regDni, setRegDni] = useState("");
  const [regTelefono, setRegTelefono] = useState("");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("usuarioEmprendiTienda");
      if (userStr) setUsuario(JSON.parse(userStr));

      const foto = localStorage.getItem("fotoPerfilUsuario");
      if (foto) setFotoPerfil(foto);

      const portada = localStorage.getItem("fotoPortadaUsuario");
      if (portada) setFotoPortada(portada);

      const historialStr = localStorage.getItem("comprasRealizadas");
      if (historialStr) setRealizadas(JSON.parse(historialStr));
    } catch (e) {}
  }, []);

  const handleFotoPerfil = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      setFotoPerfil(base64);
      try {
        localStorage.setItem("fotoPerfilUsuario", base64);
      } catch (err) {}
    };
    reader.readAsDataURL(file);
  };

  const handleFotoPortada = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      setFotoPortada(base64);
      try {
        localStorage.setItem("fotoPortadaUsuario", base64);
      } catch (err) {}
    };
    reader.readAsDataURL(file);
  };

  const cerrarSesion = () => {
    try {
      localStorage.removeItem("usuarioEmprendiTienda");
      localStorage.removeItem("fotoPerfilUsuario");
      localStorage.removeItem("fotoPortadaUsuario");
    } catch (e) {}
    setUsuario(null);
    setFotoPerfil(null);
    setFotoPortada(null);
    router.push("/cliente");
  };

  const handleCrearUsuario = (e) => {
    e.preventDefault();
    const u = {
      nombres: regNombres.trim(),
      dni: regDni.trim(),
      telefono: regTelefono.trim(),
    };
    try {
      localStorage.setItem("usuarioEmprendiTienda", JSON.stringify(u));
    } catch (err) {}
    setUsuario(u);
  };

  if (!usuario) {
    return (
      <main className="container perfil-contenedor-principal" style={{ marginTop: "40px" }}>
        <section className="selection-box" style={{ maxWidth: "500px", margin: "0 auto" }}>
          <p className="question">Registro de Usuario</p>
          <p className="intro-text">
            Ingresa tus datos para acceder a tu perfil y ver tu historial de pedidos.
          </p>

          <form onSubmit={handleCrearUsuario} className="contact-form">
            <div className="form-group" style={{ marginBottom: "15px", textAlign: "left" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Nombres y Apellidos:
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Juan Pérez"
                value={regNombres}
                onChange={(e) => setRegNombres(e.target.value)}
                style={{ width: "100%", padding: "12px", border: "2px solid #000" }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "15px", textAlign: "left" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                DNI:
              </label>
              <input
                type="text"
                required
                maxLength={8}
                pattern="[0-9]{8}"
                placeholder="Ej. 71234567"
                value={regDni}
                onChange={(e) => setRegDni(e.target.value)}
                style={{ width: "100%", padding: "12px", border: "2px solid #000" }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "20px", textAlign: "left" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                Celular:
              </label>
              <input
                type="tel"
                required
                maxLength={9}
                pattern="[0-9]{9}"
                placeholder="Ej. 987654321"
                value={regTelefono}
                onChange={(e) => setRegTelefono(e.target.value)}
                style={{ width: "100%", padding: "12px", border: "2px solid #000" }}
              />
            </div>

            <button type="submit" className="btn btn-client" style={{ width: "100%" }}>
              Guardar y Continuar
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="container perfil-contenedor-principal">
      <section className="tarjeta-perfil-header">
        <label
          htmlFor="inputPortada"
          className="portada-fondo"
          id="bannerPortada"
          title="Haz clic aquí para cambiar la imagen de portada"
          style={{
            backgroundImage: fotoPortada ? `url('${fotoPortada}')` : "none",
            cursor: "pointer",
          }}
        ></label>
        <input
          type="file"
          id="inputPortada"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFotoPortada}
        />

        <div className="foto-perfil-wrapper">
          <label
            htmlFor="inputFotoPerfil"
            style={{ cursor: "pointer", display: "block" }}
            title="Haz clic para cambiar tu foto"
          >
            <img
              src={fotoPerfil || defaultAvatar}
              alt="Usuario"
              id="imgFotoPerfil"
              className="foto-perfil-grande"
            />
          </label>

          <label
            htmlFor="inputFotoPerfil"
            className="btn-editar-foto"
            title="Cambiar foto de perfil"
            style={{ cursor: "pointer" }}
          >
            📷
          </label>
          <input
            type="file"
            id="inputFotoPerfil"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFotoPerfil}
          />
        </div>

        <div className="info-usuario-centrada" id="datosPersonalesBox">
          <h2 id="perfilNombre">{usuario.nombres}</h2>
          <p className="perfil-subdatos">
            <strong>DNI:</strong> <span id="perfilDni">{usuario.dni}</span> &nbsp;|&nbsp;
            <strong>Celular:</strong> <span id="perfilTelefono">{usuario.telefono}</span>
          </p>
          <button
            type="button"
            className="btn-cerrar-sesion-perfil"
            onClick={cerrarSesion}
          >
            Cerrar Sesión
          </button>
        </div>
      </section>

      <section className="historial-compras-seccion">
        <div className="pestanas-compras">
          <button
            type="button"
            className={`tab-compra ${activeTab === "pendientes" ? "activo" : ""}`}
            id="tabPendientes"
            onClick={() => setActiveTab("pendientes")}
          >
            Compras Pendientes (<span id="countPendientes">{cart.length}</span>)
          </button>
          <button
            type="button"
            className={`tab-compra ${activeTab === "realizadas" ? "activo" : ""}`}
            id="tabRealizadas"
            onClick={() => setActiveTab("realizadas")}
          >
            Compras Realizadas (<span id="countRealizadas">{realizadas.length}</span>)
          </button>
        </div>

        {activeTab === "pendientes" ? (
          <div id="contenedorPendientes" className="lista-pedidos-box">
            {cart.length === 0 ? (
              <p className="intro-text">No tienes compras pendientes en este momento.</p>
            ) : (
              <>
                {cart.map((prod, index) => {
                  const subtotal = ((prod.precio || 0) * (prod.cantidad || 1)).toFixed(2);
                  return (
                    <div className="tarjeta-pedido-item" key={index}>
                      <div className="pedido-info">
                        <strong>{prod.nombre}</strong>
                        <span>
                          Cantidad: {prod.cantidad} | Total: S/ {subtotal}
                        </span>
                      </div>
                      <span className="badge-estado estado-pendiente">
                        En Carrito (Pendiente)
                      </span>
                    </div>
                  );
                })}
                <br />
                <Link
                  href="/carrito"
                  className="btn btn-client"
                  style={{ display: "inline-block" }}
                >
                  Ir al Carrito para Pagar
                </Link>
              </>
            )}
          </div>
        ) : (
          <div id="contenedorRealizadas" className="lista-pedidos-box">
            {realizadas.length === 0 ? (
              <p className="intro-text">Aún no has completado ningún pedido.</p>
            ) : (
              realizadas.map((pedido, index) => (
                <div className="tarjeta-pedido-item" key={index}>
                  <div className="pedido-info">
                    <strong>Pedido del {pedido.fecha}</strong>
                    <span>Artículos: {pedido.resumen}</span>
                    <span>
                      <strong>Monto Total: S/ {pedido.total}</strong>
                    </span>
                  </div>
                  <span className="badge-estado estado-realizado">
                    Coordinado por WhatsApp
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </main>
  );
}
