"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const guardado = localStorage.getItem("modoNocturno") === "true";
    setIsDark(guardado);
    if (guardado) {
      document.documentElement.classList.add("dark");
      document.body.classList.add("modo-oscuro");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.remove("modo-oscuro");
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem("modoNocturno", String(next));
      if (next) {
        document.documentElement.classList.add("dark");
        document.body.classList.add("modo-oscuro");
      } else {
        document.documentElement.classList.remove("dark");
        document.body.classList.remove("modo-oscuro");
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
