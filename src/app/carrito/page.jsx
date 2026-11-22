"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getIdVisitante, registrarEvento, usePageTimeTracker } from "@/lib/visitor";

export default function CarritoPage() {
  const { cart, removeFromCart, clearCart, totalPrice, addToCart } = useCart();

  // Telemetría de tiempo seguido en pestaña de carrito
  usePageTimeTracker("general", "Carrito de Compras");

  const [modalOpen, setModalOpen] = useState(false);
  const [regNombres, setRegNombres] = useState("");
  const [regDni, setRegDni] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [recomendados, setRecomendados] = useState([]);

  useEffect(() => {
    const visitanteId = getIdVisitante();
    if (!visitanteId) return;

    fetch(`/api/recomendaciones?visitante=${encodeURIComponent(visitanteId)}&limite=3`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.productos)) {
          setRecomendados(data.productos);
        }
      })
      .catch(() => {});
  }, []);

  const handleAddRecommended = (prod) => {
    registrarEvento(prod.tiendaSlug || "general", "producto", prod.nombre);
    addToCart({
      nombre: prod.nombre,
      precio: prod.precio,
      imagen: prod.imagen,
      slug: prod.tiendaSlug,
    });
    alert(`¡${prod.nombre} añadido al pedido!`);
  };

  const verificarRegistroYPagar = () => {
    try {
      const usuarioRegistrado = JSON.parse(localStorage.getItem("usuarioEmprendiTienda"));
      if (!usuarioRegistrado) {
        setModalOpen(true);
      } else {
        procesarRedireccionWhatsApp(usuarioRegistrado);
      }
    } catch (e) {
      setModalOpen(true);
    }
  };

  const handleRegisterClient = (e) => {
    e.preventDefault();
    const datosUsuario = {
      nombres: regNombres.trim(),
      dni: regDni.trim(),
      telefono: regTelefono.trim(),
    };

    try {
      localStorage.setItem("usuarioEmprendiTienda", JSON.stringify(datosUsuario));
    } catch (err) {}

    setModalOpen(false);
    procesarRedireccionWhatsApp(datosUsuario);
  };

  const procesarRedireccionWhatsApp = (usuario) => {
    let total = 0;
    let textoWhatsApp = `¡Hola! Soy *${usuario.nombres}* (DNI: ${usuario.dni} | Tel: ${usuario.telefono}).\nQuiero finalizar el pago seguro de mi pedido en EMPRENDITIENDA:\n\n`;

    cart.forEach((producto) => {
      const subtotal = producto.precio * producto.cantidad;
      textoWhatsApp += `- ${producto.nombre} (Cant: ${producto.cantidad}) - S/ ${subtotal.toFixed(2)}\n`;
      total += subtotal;
    });

    textoWhatsApp += `\n*Total a pagar: S/ ${total.toFixed(2)}*\n\n¿Cómo coordinamos el pago seguro (Yape / PagoEfectivo)?`;

    const numeroWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_ADMIN || "51944403086";
    const urlFinal = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(textoWhatsApp)}`;

    try {
      let historial = JSON.parse(localStorage.getItem("comprasRealizadas")) || [];
      const resumenNombres = cart.map((p) => `${p.nombre} (x${p.cantidad})`).join(", ");
      historial.unshift({
        fecha: new Date().toLocaleDateString(),
        resumen: resumenNombres,
        total: total.toFixed(2),
      });
      localStorage.setItem("comprasRealizadas", JSON.stringify(historial));
    } catch (err) {}

    clearCart();
    window.open(urlFinal, "_blank");
  };

  return (
    <>
      <main className="container">
        <h3>Tu Carrito de Compras</h3>
        <p className="intro-text">
          Revisa tus artículos seleccionados y finaliza tu pedido de forma segura.
        </p>

        <section className="selection-box caja-resumen-carrito">
          <p className="question">Resumen del Pedido</p>

          <div id="lista-carrito">
            {cart.length === 0 ? (
              <p className="intro-text">Tu carrito está vacío.</p>
            ) : (
              cart.map((producto, index) => {
                const subtotal = (producto.precio || 0) * (producto.cantidad || 1);
                return (
                  <div className="item-carrito" key={index}>
                    <div className="item-info-izq">
                      <img
                        src={producto.imagen || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'><rect width='50' height='50' fill='%23ccc'/></svg>"}
                        alt={producto.nombre}
                        className="item-foto"
                      />
                      <div>
                        <p className="item-nombre">{producto.nombre}</p>
                        <p className="item-cantidad">Cantidad: {producto.cantidad}</p>
                      </div>
                    </div>
                    <div className="item-precio-der">
                      <span className="item-subtotal">S/ {subtotal.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        className="btn-eliminar-item"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div id="contenedor-total" className="contenedor-total-carrito">
            Total: S/ <span id="total-precio">{totalPrice.toFixed(2)}</span>
          </div>

          <p className="intro-text nota-coordinacion">
            Los artículos agregados se coordinan de manera directa y transparente con cada vendedor certificado.
          </p>

          <div className="buttons-group">
            <button
              type="button"
              id="btn-pago-whatsapp"
              className={`btn btn-client btn-whatsapp-pago ${cart.length === 0 ? "btn-whatsapp-desactivado" : ""}`}
              onClick={verificarRegistroYPagar}
              disabled={cart.length === 0}
            >
              Proceder al Pago Seguro
            </button>
          </div>
          <br />
          <br />
          <Link href="/cliente" className="btn btn-entrepreneur">
            Continuar Comprando
          </Link>
        </section>

        {recomendados && recomendados.length > 0 && (
          <section
            className="selection-box"
            style={{
              marginTop: "40px",
              textAlign: "center",
              maxWidth: "1000px",
              width: "100%",
              margin: "40px auto 0 auto",
              padding: "40px 30px",
            }}
          >
            <h3 style={{ textTransform: "uppercase", fontSize: "1.3rem", marginBottom: "8px" }}>
              💡 Quizás también te interese (Recomendados para ti)
            </h3>
            <p className="intro-text" style={{ fontSize: "0.9rem", marginBottom: "25px" }}>
              Artículos complementarios seleccionados según tu telemetría e intereses de navegación.
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 300px))",
                justifyContent: "center",
                gap: "20px",
                textAlign: "left",
              }}
            >
              {recomendados.map((prod) => (
                <div
                  className="shop-card"
                  key={prod.id || prod.nombre}
                  style={{ width: "100%", maxWidth: "300px", minWidth: "unset", margin: "0 auto" }}
                >
                  <div className="shop-image-container">
                    <img src={prod.imagen} alt={prod.nombre} />
                  </div>
                  <div className="shop-content-box">
                    <h4>{prod.nombre}</h4>
                    <p className="shop-category">{prod.categoriaNegocio} · S/ {prod.precio}</p>
                    <p className="shop-description" style={{ fontSize: "13px" }}>💡 {prod.razon}</p>
                    <button
                      type="button"
                      className="btn btn-client"
                      style={{ marginTop: "10px", width: "100%", padding: "10px", fontSize: "11px" }}
                      onClick={() => handleAddRecommended(prod)}
                    >
                      Añadir al Pedido
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {modalOpen && (
        <div id="modalRegistroPago" className="modal-usuario" style={{ display: "flex" }}>
          <div className="modal-usuario-caja">
            <span className="cerrar-modal-usuario" onClick={() => setModalOpen(false)}>
              &times;
            </span>
            <h3 style={{ marginTop: 0 }}>Registro de Seguridad</h3>
            <p style={{ fontSize: "14px", color: "#555" }}>
              Por seguridad, debes registrar tus datos antes de continuar con el pago de tus productos.
            </p>

            <form id="formRegistroCliente" onSubmit={handleRegisterClient}>
              <div className="campo-registro">
                <label htmlFor="reg-nombres">Nombres y Apellidos:</label>
                <input
                  type="text"
                  id="reg-nombres"
                  placeholder="Ej. Juan Pérez"
                  required
                  value={regNombres}
                  onChange={(e) => setRegNombres(e.target.value)}
                />
              </div>
              <div className="campo-registro">
                <label htmlFor="reg-dni">DNI (8 dígitos):</label>
                <input
                  type="text"
                  id="reg-dni"
                  maxLength={8}
                  pattern="[0-9]{8}"
                  placeholder="Ej. 71234567"
                  required
                  value={regDni}
                  onChange={(e) => setRegDni(e.target.value)}
                />
              </div>
              <div className="campo-registro">
                <label htmlFor="reg-telefono">Número de Celular:</label>
                <input
                  type="tel"
                  id="reg-telefono"
                  maxLength={9}
                  pattern="[0-9]{9}"
                  placeholder="Ej. 987654321"
                  required
                  value={regTelefono}
                  onChange={(e) => setRegTelefono(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-client" style={{ width: "100%" }}>
                Guardar Datos y Continuar al Pago
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
