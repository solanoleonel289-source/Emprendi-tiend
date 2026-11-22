"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { registrarEvento } from "@/lib/visitor";

const CartContext = createContext({
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalCount: 0,
  totalPrice: 0,
});

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("productosEnCarrito");
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error cargando carrito:", e);
    }
    setIsLoaded(true);
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    try {
      localStorage.setItem("productosEnCarrito", JSON.stringify(newCart));
    } catch (e) {}
  };

  const addToCart = (producto) => {
    const existingIndex = cart.findIndex((item) => item.nombre === producto.nombre);
    let updated;

    if (existingIndex > -1) {
      updated = [...cart];
      updated[existingIndex].cantidad += 1;
    } else {
      updated = [
        ...cart,
        {
          nombre: producto.nombre,
          precio: producto.precio,
          imagen: producto.imagen,
          cantidad: 1,
          negocioSlug: producto.slug,
        },
      ];
    }

    saveCart(updated);

    if (producto.slug) {
      registrarEvento(producto.slug, "carrito", producto.nombre);
    }
  };

  const removeFromCart = (index) => {
    const updated = cart.filter((_, i) => i !== index);
    saveCart(updated);
  };

  const updateQuantity = (index, quantity) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    const updated = [...cart];
    updated[index].cantidad = quantity;
    saveCart(updated);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const totalCount = cart.reduce((acc, item) => acc + item.cantidad, 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalCount: isLoaded ? totalCount : 0,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
