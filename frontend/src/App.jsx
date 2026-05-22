import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import { getUsuarios } from "./api/usuarios";
import { useUsuario } from "./context/usuario.context.jsx";  
import Postulacion from "./pages/Postulacion.jsx";
import Sobre from "./pages/Sobre.jsx";
import Membresias from "./pages/Membresias.jsx";
import Acceder from "./pages/Acceder.jsx";
import "./styles/App.css";

function Inicio() {
  const { usuarioPrueba } = useUsuario();  

  return (
    <main className="page hero-page">
      <section className="hero-content">
        <p className="eyebrow">CODICH</p>
        <h1>Colegio de Diseñadores Instruccionales Chile</h1>

        <p>
          Centraliza la gestión de socios, membresías, pagos y reportes en una plataforma moderna, segura y eficiente.
        </p>

        <div className="hero-actions">
          <button className="primary-btn">Ver membresías</button>
          <button className="secondary-btn">Conocer planes</button>
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

        <div className="stat-row">
          <span>Usuario test</span>
          <strong>
            {usuarioPrueba ? usuarioPrueba.nombre : "Cargando..."}
          </strong>
        </div>
      </section>
    </main>
  );
}



function Contacto() {
  return (
    <main className="page">

    </main>
  );
}



function App() {
  return (
    <>
      <Navbar />

      <div className="app-content">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/membresias" element={<Membresias />} />
          <Route path="/postulacion" element={<Postulacion />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/acceder" element={<Acceder />} />
        </Routes>
      </div>
    </>
  );
}

export default App;