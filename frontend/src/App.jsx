import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import "./App.css";

function Inicio() {
  return (
    <main className="page hero-page">
      <section className="hero-content">
        <p className="eyebrow">CODICH</p>
        <h1>Colegio de Diseñadores Instruccionales Chile

        </h1>
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
      </section>
    </main>
  );
}

function Sobre() {
  return (
    <main className="page">
      <h1>Quiénes Somos</h1>
      <p>
        El Colegio de Diseñadores Instruccionales de Chile (CODICH), es una organización que agrupa a profesionales encargados de diseñar experiencias de aprendizaje efectivas. CODICH se dedica a mejorar las habilidades de los diseñadores instruccionales mediante la colaboración, el apoyo mutuo y el impulso del reconocimiento de la profesión. El modelo de negocio de la organización se centra en brindar oportunidades de crecimiento profesional, promoviendo el aprendizaje colaborativo entre sus miembros.
      </p>
    </main>
  );
}

function Membresias() {
  return (
    <main className="page">
      <h1>Impulsa tu desarrollo profesional junto a CODICH</h1>
      <p>Forma parte de una comunidad de diseñadores instruccionales comprometidos con la innovación, colaboración y crecimiento profesional.</p>
      <div className="hero-actions">
        <button className="primary-btn">Postular ahora</button>
        <button className="secondary-btn">Mas información</button>

        <section className="hero-card">
          <h3>BENEFICIOS</h3>
          <div className="stat-row">
            <strong>Gestión Centralizada</strong>
            <span>Administra pagos, comprobantes y estado de membresía desde un solo lugar.</span>
          </div>
          <div className="stat-row">
            <strong>Acceso Seguro</strong>
            <span>Protección de datos y acceso personalizado según tu perfil.</span>
          </div>
                    <div className="stat-row">
            <strong>Seguimiento de Pagos</strong>
            <span>Consulta historial, vencimientos y comprobantes digitales.</span>
          </div>
                    <div className="stat-row">
            <strong>Comunidad Profesional</strong>
            <span>Forma parte de una red colaborativa de diseñadores instruccionales.</span>
          </div>
                    <div className="stat-row">
            <strong>Reportes y Transparencia</strong>
            <span>Información organizada y accesible para miembros y administración.</span>
          </div>
          <div className="stat-row">
            <strong>Plataforma Moderna</strong>
            <span>Interfaz intuitiva y adaptable a cualquier dispositivo.</span>
          </div>
        </section>
      </div>
    </main>
  );
}

function Postulacion() {
  return (
    <main className="page">
      <h1>Historia</h1>
      <p>
        CODICH nace como una solución para organizaciones que necesitan ordenar
        su información, mejorar el control de socios y optimizar sus procesos
        administrativos.
      </p>
    </main>
  );
}

function Contacto() {
  return (
    <main className="page">

    </main>
  );
}

function Acceder() {
  return (
    <main className="page login-page">
      <div className="login-card">
        <h1>Acceder</h1>
        <p>Ingresa a tu cuenta CODICH.</p>

        <form>
          <input type="email" placeholder="Correo electrónico" />
          <input type="password" placeholder="Contraseña" />
          <button type="button" className="primary-btn">
            Iniciar sesión
          </button>
        </form>
      </div>
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