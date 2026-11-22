import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <header className="main-header">
        <img src="/EmprendiTienda.jpg" alt="Logo de Emprendi-Tienda" className="logo-header" />
        <h1>Emprendi-Tienda</h1>
        <h2>Bienvenido a tu lugar de emprendimiento</h2>
      </header>

      <main className="container">
        <h3>Explora nuestras categorías</h3>
        <p className="intro-text">
          En Emprendi-Tienda, nos dedicamos a ofrecer seguridad a nuestros próximos emprendedores y clientes.
        </p>

        <section className="selection-box">
          <p className="question">¿Usted es un cliente o un emprendedor?</p>
          <div className="buttons-group">
            <Link href="/cliente" className="btn btn-client">
              Soy Cliente
            </Link>
            <Link href="/emprendedor" className="btn btn-entrepreneur">
              Soy Emprendedor
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
