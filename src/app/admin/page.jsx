"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Estados para cambio de contraseña
  const [passActual, setPassActual] = useState("");
  const [passNueva, setPassNueva] = useState("");
  const [passMensaje, setPassMensaje] = useState(null);
  const [passError, setPassError] = useState(null);
  const [cambiandoPass, setCambiandoPass] = useState(false);

  const [data, setData] = useState({
    opiniones: [],
    reportes: [],
    solicitudes: [],
    eventos: [],
    telemetria: {
      eventosPorTipo: [],
      interesPorCategoria: [],
      topProductosCarrito: [],
      metricasTiempo: { promedio_segundos: 0, total_segundos: 0, max_segundos: 0 },
      topPermanencia: [],
      eventosRecientes: [],
      tiempoPorUsuario: [],
    },
    offline: false,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("telemetria");
  const [updating, setUpdating] = useState(false);

  const checkSession = async () => {
    try {
      const res = await fetch("/api/admin/me");
      if (res.ok) {
        const json = await res.json();
        if (json.autenticado && json.user) {
          setCurrentUser(json.user);
          await cargarDatos();
        } else {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setAuthChecked(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setCurrentUser(json.user);
        setLoginPass("");
        await cargarDatos();
      } else {
        setLoginError(json.error || "Usuario o contraseña inválidos");
      }
    } catch (e) {
      setLoginError("Error de conexión al servidor");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}
    setCurrentUser(null);
    setData({
      opiniones: [],
      reportes: [],
      solicitudes: [],
      eventos: [],
      telemetria: {
        eventosPorTipo: [],
        interesPorCategoria: [],
        topProductosCarrito: [],
        metricasTiempo: { promedio_segundos: 0, total_segundos: 0, max_segundos: 0 },
        topPermanencia: [],
        eventosRecientes: [],
        tiempoPorUsuario: [],
      },
      offline: false,
    });
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setPassMensaje(null);
    setPassError(null);
    setCambiandoPass(true);

    try {
      const res = await fetch("/api/admin/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwordActual: passActual, passwordNueva: passNueva }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setPassMensaje("✅ Contraseña actualizada exitosamente.");
        setPassActual("");
        setPassNueva("");
      } else {
        setPassError(json.error || "No se pudo actualizar la contraseña");
      }
    } catch {
      setPassError("Error de conexión al actualizar contraseña");
    } finally {
      setCambiandoPass(false);
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin");
      if (res.status === 401) {
        setCurrentUser(null);
        return;
      }
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Error cargando datos de admin:", e);
    } finally {
      setLoading(false);
    }
  };

  const actualizarEstado = async (tipo, id, nuevoEstado) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, id, estado: nuevoEstado }),
      });
      if (res.status === 401) {
        setCurrentUser(null);
        return;
      }
      if (res.ok) {
        await cargarDatos();
      }
    } catch (e) {
      console.error("Error actualizando estado:", e);
    } finally {
      setUpdating(false);
    }
  };

  const estrellas = (pts) => {
    const valid = Math.max(0, Math.min(5, Math.round(Number(pts) || 0)));
    return "★".repeat(valid) + "☆".repeat(5 - valid);
  };

  if (!authChecked) {
    return (
      <>
        <header className="main-header">
          <img src="/EmprendiTienda.jpg" alt="Logo de Emprendi-Tienda" width="10%" />
          <h1>Panel de Administración</h1>
          <h2>Verificando autenticación...</h2>
        </header>
        <main className="container">
          <div className="selection-box" style={{ maxWidth: "450px", margin: "60px auto", textAlign: "center" }}>
            <p className="intro-text">Verificando sesión autorizada...</p>
          </div>
        </main>
      </>
    );
  }

  if (!currentUser) {
    return (
      <>
        <header className="main-header">
          <img src="/EmprendiTienda.jpg" alt="Logo de Emprendi-Tienda" width="10%" />
          <h1>Panel de Administración</h1>
          <h2>Acceso Restringido para Administradores</h2>
        </header>

        <main className="container">
          <section
            className="selection-box"
            style={{
              maxWidth: "480px",
              margin: "40px auto",
              textAlign: "left",
              padding: "45px 35px",
            }}
          >
            <h3
              style={{
                textTransform: "uppercase",
                fontSize: "1.4rem",
                marginBottom: "10px",
                textAlign: "center",
              }}
            >
              🔐 Iniciar Sesión
            </h3>
            <p
              className="intro-text"
              style={{
                fontSize: "0.9rem",
                textAlign: "center",
                marginBottom: "25px",
              }}
            >
              Ingresa con tu cuenta de administrador (usuario y contraseña) para acceder a los datos de la plataforma.
            </p>

            {loginError && (
              <div
                style={{
                  background: "#ffebee",
                  border: "2px solid #d32f2f",
                  color: "#c62828",
                  padding: "12px",
                  marginBottom: "20px",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                  textTransform: "uppercase",
                }}
              >
                ⚠️ {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div>
                <label
                  htmlFor="admin-user"
                  style={{
                    display: "block",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    fontSize: "0.8rem",
                    marginBottom: "6px",
                  }}
                >
                  Usuario:
                </label>
                <input
                  type="text"
                  id="admin-user"
                  required
                  autoComplete="username"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  placeholder="Ej: admin"
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: "2px solid #000000",
                    fontSize: "0.95rem",
                    fontFamily: "Arial, sans-serif",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="admin-pass"
                  style={{
                    display: "block",
                    fontWeight: 900,
                    textTransform: "uppercase",
                    fontSize: "0.8rem",
                    marginBottom: "6px",
                  }}
                >
                  Contraseña:
                </label>
                <input
                  type="password"
                  id="admin-pass"
                  required
                  autoComplete="current-password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "14px",
                    border: "2px solid #000000",
                    fontSize: "0.95rem",
                    fontFamily: "Arial, sans-serif",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-client"
                disabled={loggingIn}
                style={{
                  width: "100%",
                  padding: "16px",
                  marginTop: "10px",
                  fontSize: "0.9rem",
                  cursor: loggingIn ? "not-allowed" : "pointer",
                }}
              >
                {loggingIn ? "Verificando..." : "Entrar al Panel"}
              </button>
            </form>

            <div style={{ marginTop: "25px", textAlign: "center" }}>
              <Link
                href="/"
                className="btn btn-entrepreneur"
                style={{ margin: 0, padding: "10px 20px", fontSize: "0.8rem" }}
              >
                ← Volver a la Tienda
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="main-header">
        <img src="/EmprendiTienda.jpg" alt="Logo de Emprendi-Tienda" width="10%" />
        <h1>Panel de Administración</h1>
        <h2>Control de moderación, solicitudes y telemetría de Emprendi-Tienda</h2>
      </header>

      <main className="container">
        <section className="selection-box" style={{ textAlign: "left", maxWidth: "1000px", margin: "0 auto" }}>
          {/* Barra de sesión activa */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              borderBottom: "2px solid #000000",
              paddingBottom: "15px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: 900 }}>
                🟢 Sesión Activa:
              </span>
              <span
                style={{
                  background: "#000000",
                  color: "#00cd6b",
                  padding: "4px 10px",
                  fontWeight: 900,
                  fontSize: "12px",
                  border: "2px solid #000000",
                  textTransform: "uppercase",
                }}
              >
                {currentUser.nombre || currentUser.username} ({currentUser.username})
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-entrepreneur"
              style={{
                margin: 0,
                padding: "8px 16px",
                fontSize: "11px",
                background: "#ffffff",
                color: "#000000",
              }}
            >
              🚪 Cerrar Sesión
            </button>
          </div>

          {/* Barra de pestañas original */}
          <div className="pestanas-compras" style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              className={`tab-compra ${activeTab === "telemetria" ? "activo" : ""}`}
              onClick={() => setActiveTab("telemetria")}
            >
              📊 Telemetría y Minería
            </button>

            <button
              type="button"
              className={`tab-compra ${activeTab === "opiniones" ? "activo" : ""}`}
              onClick={() => setActiveTab("opiniones")}
            >
              💬 Opiniones ({data.opiniones.length})
            </button>

            <button
              type="button"
              className={`tab-compra ${activeTab === "solicitudes" ? "activo" : ""}`}
              onClick={() => setActiveTab("solicitudes")}
            >
              📋 Solicitudes ({data.solicitudes.length})
            </button>

            <button
              type="button"
              className={`tab-compra ${activeTab === "reportes" ? "activo" : ""}`}
              onClick={() => setActiveTab("reportes")}
            >
              ⚠️ Reportes ({data.reportes.length})
            </button>

            <button
              type="button"
              className={`tab-compra ${activeTab === "cuenta" ? "activo" : ""}`}
              onClick={() => setActiveTab("cuenta")}
            >
              🔐 Cuenta y Seguridad
            </button>

            <button
              type="button"
              className="btn btn-entrepreneur"
              style={{ marginLeft: "auto", padding: "8px 16px", fontSize: "12px" }}
              onClick={cargarDatos}
            >
              {loading ? "Cargando..." : "🔄 Actualizar"}
            </button>
          </div>

          {/* PESTAÑA: TELEMETRÍA Y MINERÍA DE DATOS */}
          {activeTab === "telemetria" && (
            <div style={{ marginTop: "20px" }}>
              <p className="question" style={{ marginBottom: "15px" }}>
                Telemetría y Minería de Intereses de Clientes
              </p>

              {/* Tarjetas resumen con .benefits-grid */}
              <div className="benefits-grid" style={{ marginBottom: "25px" }}>
                <div className="benefit-card">
                  <h4>📡 Total Telemetría</h4>
                  <p style={{ fontSize: "2rem", fontWeight: "900", margin: "10px 0" }}>
                    {(data.telemetria?.eventosPorTipo || []).reduce((acc, curr) => acc + curr.total, 0)}
                  </p>
                  <p style={{ fontSize: "12px", color: "#555" }}>Eventos registrados en PostgreSQL</p>
                </div>

                <div className="benefit-card">
                  <h4>🏪 Visitas a Tiendas</h4>
                  <p style={{ fontSize: "2rem", fontWeight: "900", margin: "10px 0" }}>
                    {(data.telemetria?.eventosPorTipo || []).find((e) => e.tipo === "ficha")?.total || 0}
                  </p>
                  <p style={{ fontSize: "12px", color: "#555" }}>Vistas de fichas de emprendimientos</p>
                </div>

                <div className="benefit-card">
                  <h4>🛒 Añadidos al Carrito</h4>
                  <p style={{ fontSize: "2rem", fontWeight: "900", margin: "10px 0", color: "#00cd6b" }}>
                    {(data.telemetria?.eventosPorTipo || []).find((e) => e.tipo === "carrito")?.total || 0}
                  </p>
                  <p style={{ fontSize: "12px", color: "#555" }}>Alta intención de compra detectada</p>
                </div>

                <div className="benefit-card">
                  <h4>🔍 Búsquedas y Clics</h4>
                  <p style={{ fontSize: "2rem", fontWeight: "900", margin: "10px 0" }}>
                    {((data.telemetria?.eventosPorTipo || []).find((e) => e.tipo === "busqueda")?.total || 0) +
                      ((data.telemetria?.eventosPorTipo || []).find((e) => e.tipo === "producto")?.total || 0)}
                  </p>
                  <p style={{ fontSize: "12px", color: "#555" }}>Términos y productos explorados</p>
                </div>

                <div className="benefit-card">
                  <h4>⏱️ Tiempo Promedio</h4>
                  <p style={{ fontSize: "2rem", fontWeight: "900", margin: "10px 0", color: "#00cd6b" }}>
                    {data.telemetria?.metricasTiempo?.promedio_segundos || 0}s
                  </p>
                  <p style={{ fontSize: "12px", color: "#555" }}>
                    Permanencia seguida por sesión
                  </p>
                </div>
              </div>

              {/* Distribución de Intereses por Categoría */}
              <div style={{ marginBottom: "30px", border: "2px solid #000", padding: "20px", background: "#fff" }}>
                <h4 style={{ textTransform: "uppercase", marginBottom: "15px", fontSize: "16px" }}>
                  🎯 Distribución de Intereses por Categoría
                </h4>

                {(!data.telemetria?.interesPorCategoria || data.telemetria.interesPorCategoria.length === 0) ? (
                  <p className="intro-text">No hay suficientes datos acumulados aún.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {data.telemetria.interesPorCategoria.map((cat) => {
                      const totalGeneral =
                        data.telemetria.interesPorCategoria.reduce((a, b) => a + b.total_interacciones, 0) || 1;
                      const pct = Math.round((cat.total_interacciones / totalGeneral) * 100);
                      return (
                        <div key={cat.categoria}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "13px", fontWeight: "bold" }}>
                            <span>{cat.categoria}</span>
                            <span>{pct}% ({cat.total_interacciones} interacciones · {cat.total_carritos} pedidos)</span>
                          </div>
                          <div style={{ width: "100%", height: "14px", background: "#e0e0e0", border: "2px solid #000" }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                background: "#00cd6b",
                                transition: "width 0.4s ease",
                              }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Ranking de Productos más pedidos */}
              <div style={{ marginBottom: "30px", border: "2px solid #000", padding: "20px", background: "#fff" }}>
                <h4 style={{ textTransform: "uppercase", marginBottom: "15px", fontSize: "16px" }}>
                  🔥 Artículos más Solicitados en Carrito
                </h4>

                {(!data.telemetria?.topProductosCarrito || data.telemetria.topProductosCarrito.length === 0) ? (
                  <p className="intro-text">Aún no hay compras registradas en telemetría.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {data.telemetria.topProductosCarrito.map((prod, idx) => (
                      <div
                        key={idx}
                        className="tarjeta-pedido-item"
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <div>
                          <strong style={{ fontSize: "15px" }}>#{idx + 1} {prod.producto}</strong>
                        </div>
                        <span
                          style={{
                            background: "#000",
                            color: "#00cd6b",
                            padding: "6px 12px",
                            fontWeight: "900",
                            fontSize: "12px",
                            border: "1px solid #000",
                          }}
                        >
                          {prod.total_carritos} pedidos
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Artículos con mayor tiempo de atención continuo */}
              <div style={{ marginBottom: "30px", border: "2px solid #000", padding: "20px", background: "#fff" }}>
                <h4 style={{ textTransform: "uppercase", marginBottom: "15px", fontSize: "16px" }}>
                  ⏳ Artículos con Mayor Tiempo de Atención Continuo
                </h4>

                {(!data.telemetria?.topPermanencia || data.telemetria.topPermanencia.length === 0) ? (
                  <p className="intro-text">Aún no hay mediciones de tiempo registradas.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {data.telemetria.topPermanencia.map((item, idx) => (
                      <div
                        key={idx}
                        className="tarjeta-pedido-item"
                        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}
                      >
                        <div>
                          <strong style={{ fontSize: "15px" }}>#{idx + 1} {item.producto}</strong>
                          <span style={{ fontSize: "12px", color: "#666", marginLeft: "10px" }}>
                            ({item.total_sesiones} vistas continuas)
                          </span>
                        </div>
                        <span
                          style={{
                            background: "#000",
                            color: "#00cd6b",
                            padding: "6px 12px",
                            fontWeight: "900",
                            fontSize: "12px",
                            border: "1px solid #000",
                          }}
                        >
                          ⏱️ {item.segundos_totales}s acumulados ({item.promedio_segundos}s prom)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Desglose de Tiempo y Actividad por Cada Usuario */}
              <div style={{ marginBottom: "30px", border: "2px solid #000", padding: "20px", background: "#fff" }}>
                <h4 style={{ textTransform: "uppercase", marginBottom: "15px", fontSize: "16px" }}>
                  👥 Tiempo y Actividad por Cada Usuario
                </h4>

                {(!data.telemetria?.tiempoPorUsuario || data.telemetria.tiempoPorUsuario.length === 0) ? (
                  <p className="intro-text">No hay usuarios registrados aún.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    {data.telemetria.tiempoPorUsuario.map((user) => (
                      <div
                        key={user.visitante}
                        className="tarjeta-pedido-item"
                        style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "15px", border: "2px solid #000" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
                          <div>
                            <strong style={{ fontSize: "16px" }}>
                              👤 {user.nombre_usuario !== "Visitante Anónimo" ? user.nombre_usuario : `Cliente #${user.visitante.slice(0, 8)}`}
                            </strong>
                            <span style={{ fontSize: "11px", color: "#666", marginLeft: "10px", fontFamily: "monospace" }}>
                              ID: {user.visitante.slice(0, 16)}...
                            </span>
                          </div>

                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <span
                              style={{
                                background: "#000",
                                color: "#00cd6b",
                                padding: "6px 12px",
                                fontWeight: "900",
                                fontSize: "13px",
                                border: "1px solid #000",
                              }}
                            >
                              ⏱️ {user.segundos_totales >= 60 ? `${user.minutos_totales} min (${user.segundos_totales}s)` : `${user.segundos_totales} segundos`}
                            </span>
                            <span style={{ background: "#eee", padding: "6px 10px", fontWeight: "bold", fontSize: "12px" }}>
                              ⚡ {user.total_eventos} acciones ({user.total_carritos} carritos)
                            </span>
                          </div>
                        </div>

                        {/* Detalle de productos y secciones que vio este usuario */}
                        <div>
                          <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "6px", color: "#333", textTransform: "uppercase" }}>
                            Qué vio este usuario y cuánto tiempo pasó:
                          </p>
                          {user.productos_vistos && user.productos_vistos.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                              {user.productos_vistos.map((p, pIdx) => (
                                <span
                                  key={pIdx}
                                  style={{
                                    background: p.segundos > 0 ? "#f4fdf8" : "#f5f5f5",
                                    border: p.segundos > 0 ? "1px solid #00cd6b" : "1px solid #ccc",
                                    padding: "4px 8px",
                                    fontSize: "12px",
                                    borderRadius: "4px",
                                  }}
                                >
                                  <strong>{p.producto}</strong>
                                  {p.segundos > 0 && (
                                    <span style={{ color: "#00a854", fontWeight: "900", marginLeft: "6px" }}>
                                      ⏱️ {p.segundos}s
                                    </span>
                                  )}
                                  <span style={{ color: "#777", fontSize: "10px", marginLeft: "4px" }}>
                                    ({p.veces}x)
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>
                              Visitas de catálogo sin tiempo específico registrado.
                            </p>
                          )}
                        </div>

                        <div style={{ fontSize: "11px", color: "#888", display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
                          <span>Primera visita: {new Date(user.primera_visita).toLocaleString()}</span>
                          <span>Última actividad: {new Date(user.ultima_actividad).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Flujo de Telemetría en tiempo real */}
              <div style={{ border: "2px solid #000", padding: "20px", background: "#fff", overflowX: "auto" }}>
                <h4 style={{ textTransform: "uppercase", marginBottom: "15px", fontSize: "16px" }}>
                  📡 Flujo de Telemetría en Vivo (Últimos Eventos)
                </h4>

                {(!data.telemetria?.eventosRecientes || data.telemetria.eventosRecientes.length === 0) ? (
                  <p className="intro-text">Sin eventos recientes.</p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #000", textAlign: "left" }}>
                        <th style={{ padding: "8px" }}>Visitante</th>
                        <th style={{ padding: "8px" }}>Acción</th>
                        <th style={{ padding: "8px" }}>Detalle / Producto</th>
                        <th style={{ padding: "8px" }}>Tiempo Seguido</th>
                        <th style={{ padding: "8px" }}>Tienda</th>
                        <th style={{ padding: "8px" }}>Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.telemetria.eventosRecientes.map((ev) => (
                        <tr key={ev.id} style={{ borderBottom: "1px solid #ddd" }}>
                          <td style={{ padding: "8px", fontSize: "12px" }}>
                            <strong>
                              {ev.usuario_nombre && ev.usuario_nombre !== "Visitante Anónimo"
                                ? ev.usuario_nombre
                                : `Cliente #${ev.visitante?.slice(0, 8)}`}
                            </strong>
                          </td>
                          <td style={{ padding: "8px" }}>
                            <span
                              style={{
                                background: ev.tipo === "carrito" ? "#00cd6b" : ev.tipo === "tiempo" ? "#3b82f6" : "#000",
                                color: ev.tipo === "carrito" ? "#000" : "#fff",
                                padding: "3px 8px",
                                fontSize: "10px",
                                fontWeight: "bold",
                                textTransform: "uppercase",
                              }}
                            >
                              {ev.tipo}
                            </span>
                          </td>
                          <td style={{ padding: "8px", fontWeight: "bold" }}>
                            {ev.producto || "—"}
                          </td>
                          <td style={{ padding: "8px", fontWeight: "bold", color: ev.duracion_segundos > 0 ? "#00cd6b" : "#999" }}>
                            {ev.duracion_segundos > 0 ? `⏱️ ${ev.duracion_segundos}s` : "—"}
                          </td>
                          <td style={{ padding: "8px" }}>
                            {ev.negocio_nombre || "—"}
                          </td>
                          <td style={{ padding: "8px", fontSize: "11px", color: "#666" }}>
                            {new Date(ev.creado_en).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* PESTAÑA: MODERACIÓN DE OPINIONES */}
          {activeTab === "opiniones" && (
            <div style={{ marginTop: "20px" }}>
              <p className="question" style={{ marginBottom: "15px" }}>
                Moderación de Opiniones
              </p>

              {data.opiniones.length === 0 ? (
                <p className="intro-text">No hay opiniones registradas.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {data.opiniones.map((op) => (
                    <div
                      key={op.id}
                      className="tarjeta-pedido-item"
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                          <strong>{op.nombre}</strong>
                          <span style={{ fontSize: "12px", color: "#666" }}>para {op.negocio_nombre || "Tienda"}</span>
                          <span style={{ color: "#f59e0b", fontSize: "16px" }}>{estrellas(op.puntos)}</span>
                          <span
                            style={{
                              padding: "2px 8px",
                              fontSize: "11px",
                              fontWeight: "bold",
                              textTransform: "uppercase",
                              background: op.estado === "aprobada" ? "#00cd6b" : op.estado === "rechazada" ? "#ef4444" : "#eab308",
                              color: op.estado === "aprobada" ? "#000" : "#fff",
                            }}
                          >
                            {op.estado}
                          </span>
                        </div>
                        <p style={{ margin: "5px 0", fontSize: "14px" }}>"{op.comentario}"</p>
                        <span style={{ fontSize: "11px", color: "#888" }}>
                          Fecha: {new Date(op.creado_en).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        {op.estado !== "aprobada" && (
                          <button
                            type="button"
                            onClick={() => actualizarEstado("opinion", op.id, "aprobada")}
                            disabled={updating}
                            className="btn btn-client"
                            style={{ padding: "8px 14px", fontSize: "12px" }}
                          >
                            Aprobar
                          </button>
                        )}
                        {op.estado !== "rechazada" && (
                          <button
                            type="button"
                            onClick={() => actualizarEstado("opinion", op.id, "rechazada")}
                            disabled={updating}
                            className="btn btn-entrepreneur"
                            style={{ padding: "8px 14px", fontSize: "12px" }}
                          >
                            Rechazar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA: SOLICITUDES DE TIENDAS */}
          {activeTab === "solicitudes" && (
            <div style={{ marginTop: "20px" }}>
              <p className="question" style={{ marginBottom: "15px" }}>
                Solicitudes de Emprendedores
              </p>

              {data.solicitudes.length === 0 ? (
                <p className="intro-text">No hay solicitudes de nuevos emprendimientos.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {data.solicitudes.map((sol) => (
                    <div
                      key={sol.id}
                      className="tarjeta-pedido-item"
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                          <strong style={{ fontSize: "16px" }}>{sol.tienda}</strong>
                          <span style={{ fontSize: "12px", color: "#666" }}>por {sol.nombre}</span>
                          <span style={{ background: "#eee", padding: "2px 8px", fontSize: "11px", fontWeight: "bold" }}>
                            {sol.estado}
                          </span>
                        </div>
                        <p style={{ margin: "5px 0", fontSize: "13px" }}>
                          Correo: <strong>{sol.correo}</strong> | Tel: <strong>{sol.whatsapp}</strong>
                        </p>
                        <p style={{ margin: "5px 0", fontSize: "13px", fontStyle: "italic", color: "#444" }}>
                          Productos: "{sol.mensaje}"
                        </p>
                        <span style={{ fontSize: "11px", color: "#888" }}>
                          Fecha: {new Date(sol.creado_en).toLocaleString()}
                        </span>
                      </div>

                      <div>
                        <a
                          href={`https://wa.me/${sol.whatsapp.replace(/[^0-9]/g, "")}?text=Hola%20${encodeURIComponent(sol.nombre)},%20te%20escribimos%20de%20EMPRENDITIENDA%20respecto%20a%20tu%20solicitud%20para%20${encodeURIComponent(sol.tienda)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-client"
                          style={{ padding: "8px 14px", fontSize: "12px", display: "inline-block" }}
                        >
                          Contactar WhatsApp
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA: REPORTES DE CLIENTES */}
          {activeTab === "reportes" && (
            <div style={{ marginTop: "20px" }}>
              <p className="question" style={{ marginBottom: "15px" }}>
                Reportes Recibidos
              </p>

              {data.reportes.length === 0 ? (
                <p className="intro-text">No hay reportes de clientes registrados.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {data.reportes.map((rep) => (
                    <div
                      key={rep.id}
                      className="tarjeta-pedido-item"
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                          <strong style={{ color: "#dc2626", textTransform: "uppercase" }}>{rep.motivo}</strong>
                          <span style={{ fontSize: "12px", color: "#666" }}>contra {rep.negocio_nombre || "Tienda"}</span>
                          <span style={{ background: "#eee", padding: "2px 8px", fontSize: "11px", fontWeight: "bold" }}>
                            {rep.estado}
                          </span>
                        </div>
                        <p style={{ margin: "5px 0", fontSize: "14px" }}>{rep.detalle}</p>
                        <span style={{ fontSize: "11px", color: "#888" }}>
                          Fecha: {new Date(rep.creado_en).toLocaleString()}
                        </span>
                      </div>

                      <div>
                        {rep.estado !== "cerrado" ? (
                          <button
                            type="button"
                            onClick={() => actualizarEstado("reporte", rep.id, "cerrado")}
                            className="btn btn-entrepreneur"
                            style={{ padding: "8px 14px", fontSize: "12px" }}
                          >
                            Marcar Cerrado
                          </button>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#888", fontWeight: "bold" }}>Caso Cerrado</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA: GESTIÓN DE CUENTA Y SEGURIDAD */}
          {activeTab === "cuenta" && (
            <div style={{ marginTop: "20px" }}>
              <p className="question" style={{ marginBottom: "15px" }}>
                Gestión de Cuenta y Credenciales de Administrador
              </p>

              <div className="tarjeta-pedido-item" style={{ marginBottom: "25px" }}>
                <h4 style={{ textTransform: "uppercase", marginBottom: "8px" }}>Datos de la Cuenta</h4>
                <p style={{ margin: "6px 0", fontSize: "14px" }}>
                  <strong>Usuario:</strong> {currentUser?.username}
                </p>
                <p style={{ margin: "6px 0", fontSize: "14px" }}>
                  <strong>Nombre de Administrador:</strong> {currentUser?.nombre || currentUser?.username}
                </p>
                <p style={{ margin: "6px 0", fontSize: "14px", color: "#00cd6b", fontWeight: "bold" }}>
                  ● Estado: Sesión Activa y Autorizada
                </p>
              </div>

              <div className="tarjeta-pedido-item">
                <h4 style={{ textTransform: "uppercase", marginBottom: "10px" }}>Cambiar Contraseña</h4>
                <p className="intro-text" style={{ fontSize: "13px", marginBottom: "15px" }}>
                  Actualiza tu contraseña de acceso para mantener protegida la administración.
                </p>

                {passMensaje && (
                  <div
                    style={{
                      background: "#e8f5e9",
                      border: "2px solid #2e7d32",
                      color: "#1b5e20",
                      padding: "10px",
                      marginBottom: "15px",
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    {passMensaje}
                  </div>
                )}

                {passError && (
                  <div
                    style={{
                      background: "#ffebee",
                      border: "2px solid #c62828",
                      color: "#c62828",
                      padding: "10px",
                      marginBottom: "15px",
                      fontWeight: "bold",
                      fontSize: "13px",
                    }}
                  >
                    ⚠️ {passError}
                  </div>
                )}

                <form onSubmit={handleCambiarPassword} style={{ maxWidth: "450px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", marginBottom: "4px" }}>
                      Contraseña Actual:
                    </label>
                    <input
                      type="password"
                      required
                      value={passActual}
                      onChange={(e) => setPassActual(e.target.value)}
                      placeholder="Tu contraseña actual"
                      style={{ width: "100%", padding: "10px", border: "2px solid #000", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "900", textTransform: "uppercase", marginBottom: "4px" }}>
                      Nueva Contraseña (mínimo 6 caracteres):
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passNueva}
                      onChange={(e) => setPassNueva(e.target.value)}
                      placeholder="Nueva contraseña segura"
                      style={{ width: "100%", padding: "10px", border: "2px solid #000", boxSizing: "border-box" }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-client"
                    disabled={cambiandoPass}
                    style={{ marginTop: "10px", padding: "12px 20px", fontSize: "12px" }}
                  >
                    {cambiandoPass ? "Actualizando..." : "Guardar Nueva Contraseña"}
                  </button>
                </form>
              </div>
            </div>
          )}

          <br />
          <br />
          <Link href="/" className="btn btn-entrepreneur">
            Volver al Inicio
          </Link>
        </section>
      </main>
    </>
  );
}
