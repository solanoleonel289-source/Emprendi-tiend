"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useTheme } from "@/context/ThemeContext";
import { registrarEvento } from "@/lib/visitor";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { totalCount } = useCart();
  const { isDark, toggleTheme } = useTheme();

  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [hasUser, setHasUser] = useState(false);

  useEffect(() => {
    try {
      const user = localStorage.getItem("usuarioEmprendiTienda");
      setHasUser(Boolean(user));
      const photo = localStorage.getItem("fotoPerfilUsuario");
      if (photo) setAvatar(photo);
    } catch (e) {}
  }, []);

  if (pathname === "/") {
    return null;
  }

  const isEmprendedor = pathname === "/emprendedor" || pathname?.startsWith("/emprendedor/");

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (query) {
      registrarEvento("general", "busqueda", query);
    }
    setMenuOpen(false);
    router.push(`/cliente?buscar=${encodeURIComponent(query)}`);
  };

  const filtrarPorCategoria = (cat) => {
    setMenuOpen(false);
    if (cat && cat !== "todos") {
      registrarEvento("general", "categoria", cat);
    }
    router.push(`/cliente?categoria=${encodeURIComponent(cat)}`);
  };

  const toggleSubmenu = (id) => {
    setOpenSubmenu(openSubmenu === id ? null : id);
  };

  return (
    <nav className={`nav-cliente-puma ${isEmprendedor ? "nav-modo-emprendedor" : ""}`}>
      <div className="nav-fila-principal">
        <div className="nav-logo-left">
          <Link href="/">
            <img src="/EmprendiTienda.jpg" alt="Logo de Emprendi-Tienda" />
          </Link>
        </div>

        <div className="nav-esquina-derecha">
          {isEmprendedor ? (
            <button
              type="button"
              id="btnModoNocturno"
              className="btn-modo-nocturno"
              onClick={toggleTheme}
              title="Cambiar tema"
              aria-label="Cambiar tema de color"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          ) : (
            <>
              {/* Buscador para pantallas medianas/grandes */}
              <form onSubmit={handleSearch} className="search-form-puma-expand search-form-desktop" id="pumaSearchForm">
                <input
                  type="text"
                  placeholder="¿QUÉ ESTÁS BUSCANDO HOY?"
                  name="buscar"
                  className="search-input-puma-expand"
                  id="pumaSearchInput"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="search-btn-puma-expand">
                  BUSCAR
                </button>
              </form>

              {/* Iconos de acción */}
              <div className="nav-iconos-grupo">
                <Link
                  href="/perfil"
                  id="btnIconoPerfil"
                  className="btn-perfil-usuario"
                  title="Ir a mi perfil"
                  aria-label="Mi perfil"
                  style={{ display: "flex", textDecoration: "none" }}
                >
                  {avatar ? (
                    <img src={avatar} alt="Perfil" className="mini-avatar-nav" />
                  ) : (
                    "👤"
                  )}
                </Link>

                <button
                  type="button"
                  id="btnModoNocturno"
                  className="btn-modo-nocturno"
                  onClick={toggleTheme}
                  title="Cambiar tema"
                  aria-label="Cambiar tema de color"
                >
                  {isDark ? "☀️" : "🌙"}
                </button>

                <Link href="/carrito" className="nav-cart-puma" title="Ver carrito" aria-label="Carrito de compras">
                  🛒 <span id="cart-counter">{totalCount}</span>
                </Link>

                <button
                  type="button"
                  className="btn-hamburguesa"
                  id="btnToggleMenu"
                  aria-label="Abrir categorías"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <span></span>
                  <span></span>
                  <span></span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Buscador móvil optimizado (sólo visible en pantallas pequeñas) */}
      {!isEmprendedor && (
        <div className="search-mobile-container">
          <form onSubmit={handleSearch} className="search-form-mobile">
            <input
              type="text"
              placeholder="¿Qué estás buscando hoy?"
              name="buscar-movil"
              className="search-input-mobile"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="search-btn-mobile" aria-label="Buscar">
              🔍
            </button>
          </form>
        </div>
      )}

      {/* Menú desplegable de categorías */}
      {!isEmprendedor && (
        <ul className={`panel-menu-hamburguesa ${menuOpen ? "activo" : ""}`} id="panelCategorias">
          <li>
            <button
              type="button"
              className="categoria-principal-btn"
              onClick={() => filtrarPorCategoria("todos")}
            >
              Ver Todo el Catálogo
            </button>
          </li>
          <li>
            <button
              type="button"
              className="categoria-principal-btn"
              onClick={() => toggleSubmenu("sub-ropa")}
            >
              Ropa <span>▾</span>
            </button>
            <ul className={`subdivisiones-lista ${openSubmenu === "sub-ropa" ? "abierto" : ""}`} id="sub-ropa">
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); filtrarPorCategoria("ropa"); }}>
                  Todo en Ropa
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); filtrarPorCategoria("zapatos"); }}>
                  Zapatos y Zapatillas
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); filtrarPorCategoria("pantalones"); }}>
                  Pantalones
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); filtrarPorCategoria("polos"); }}>
                  Polos
                </a>
              </li>
            </ul>
          </li>
          <li>
            <button
              type="button"
              className="categoria-principal-btn"
              onClick={() => toggleSubmenu("sub-tec")}
            >
              Tecnología <span>▾</span>
            </button>
            <ul className={`subdivisiones-lista ${openSubmenu === "sub-tec" ? "abierto" : ""}`} id="sub-tec">
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); filtrarPorCategoria("tecnologia"); }}>
                  Todo en Tecnología
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); filtrarPorCategoria("celular"); }}>
                  Celulares y Reparación
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); filtrarPorCategoria("accesorios"); }}>
                  Accesorios
                </a>
              </li>
            </ul>
          </li>
          <li>
            <button
              type="button"
              className="categoria-principal-btn"
              onClick={() => toggleSubmenu("sub-hogar")}
            >
              Hogar <span>▾</span>
            </button>
            <ul className={`subdivisiones-lista ${openSubmenu === "sub-hogar" ? "abierto" : ""}`} id="sub-hogar">
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); filtrarPorCategoria("hogar"); }}>
                  Todo en Hogar
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); filtrarPorCategoria("decoracion"); }}>
                  Decoración
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); filtrarPorCategoria("muebles"); }}>
                  Muebles
                </a>
              </li>
            </ul>
          </li>
          <li>
            <button
              type="button"
              className="categoria-principal-btn"
              onClick={() => toggleSubmenu("sub-comida")}
            >
              Comida <span>▾</span>
            </button>
            <ul className={`subdivisiones-lista ${openSubmenu === "sub-comida" ? "abierto" : ""}`} id="sub-comida">
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); filtrarPorCategoria("comida"); }}>
                  Toda la Comida
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); filtrarPorCategoria("postres"); }}>
                  Postres y Tortas
                </a>
              </li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); filtrarPorCategoria("rapida"); }}>
                  Comida Rápida
                </a>
              </li>
            </ul>
          </li>
        </ul>
      )}
    </nav>
  );
}
export default Navbar;
