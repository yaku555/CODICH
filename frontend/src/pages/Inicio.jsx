import { useState } from "react";
import { useUsuario } from "../context/usuario.context.jsx";

function Inicio() {
  const { usuarioPrueba, usuario } = useUsuario();
  const [enviando, setEnviando] = useState(false);



  return (
    <main className="page hero-page">
      <section className="hero-content">
        <p className="eyebrow">CODICH</p>
        <h1>Colegio de Diseñadores Instruccionales Chile</h1>

        <p>
          Centraliza la gestión de socios, membresías, pagos y reportes en una
          plataforma moderna, segura y eficiente.
        </p>

        <div className="hero-actions">
          <a href="/membresia" className="secondary-btn">VER MEMBRESIA</a>

          <a href="/postulacion" className="secondary-btn">POSTULAR</a>

        </div>
      </section>

      <section className="hero-card">
        <h3>Resumen general</h3>

        <div className="stat-row">
          <span>Socios activos</span>
          <strong>248</strong>
        </div>

        <div className="stat-row">
          <span>Membresías vigentes</span>
          <strong>193</strong>
        </div>

        <div className="stat-row">
          <span>Reportes generados</span>
          <strong>32</strong>
        </div>


      </section>
    </main>
  );
}

export default Inicio;