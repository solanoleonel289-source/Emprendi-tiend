import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#000000",
};

export const metadata = {
  title: "Emprendi-Tienda | Tu lugar de emprendimiento",
  description:
    "Comunidad y plataforma segura para emprendedores y clientes locales. Compra, vende y apoya lo nacional.",
  icons: {
    icon: "/EmprendiTienda.jpg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <CartProvider>
            <Navbar />
            {children}
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
