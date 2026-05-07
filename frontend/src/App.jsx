import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import "./App.css";

function Inicio() {
  return (
    <main className="page hero-page">
      <section className="hero-content">
        <p className="eyebrow">Sistema de gestión CODICH</p>
        <h1>Gestión inteligente de membresías</h1>
        <p>
          Centraliza socios, planes, pagos, reportes y administración en una
          plataforma simple, moderna y segura.
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

function Membresias() {
  return (
    <main className="page">
      <h1>Membresías</h1>
      <p>
        En esta sección se podrán registrar, revisar, editar y administrar las
        membresías de los usuarios de CODICH.
      </p>

      <div className="cards-grid">
        <div className="info-card">
          <h3>Membresía Básica</h3>
          <p>Acceso general a beneficios y seguimiento de estado.</p>
        </div>

        <div className="info-card">
          <h3>Membresía Premium</h3>
          <p>Mayor nivel de beneficios, reportes y soporte personalizado.</p>
        </div>

        <div className="info-card">
          <h3>Membresía Institucional</h3>
          <p>Gestión pensada para grupos, empresas u organizaciones.</p>
        </div>
      </div>
    </main>
  );
}

function Reportes() {
  return (
    <main className="page">
      <h1>Reportes</h1>
      <p>
        Aquí se visualizarán reportes de membresías activas, vencidas, pagos,
        crecimiento de usuarios y actividad general del sistema.
      </p>

      <div className="report-box">
        <h3>Reporte mensual de ejemplo</h3>
        <p>Total de membresías activas: 193</p>
        <p>Membresías vencidas: 21</p>
        <p>Nuevos registros del mes: 34</p>
      </div>
    </main>
  );
}

function QuienesSomos() {
  return (
    <main className="page">
      <h1>Quiénes Somos</h1>
      <p>
        CODICH es una plataforma orientada a simplificar la gestión de
        membresías, facilitando la administración de usuarios, planes, pagos y
        reportes desde un solo lugar.
      </p>
    </main>
  );
}

function Historia() {
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

function Planes() {
  return (
    <main className="page">
      <h1>Planes</h1>
      <p>
        Revisa los distintos planes disponibles para adaptar CODICH a las
        necesidades de cada organización.
      </p>

      <div className="cards-grid">
        <div className="plan-card">
          <h3>Plan Inicial</h3>
          <p>Ideal para organizaciones pequeñas.</p>
          <strong>$9.990 / mes</strong>
        </div>

        <div className="plan-card featured">
          <h3>Plan Gestión</h3>
          <p>Para organizaciones con mayor cantidad de miembros.</p>
          <strong>$19.990 / mes</strong>
        </div>

        <div className="plan-card">
          <h3>Plan Empresa</h3>
          <p>Solución avanzada con reportes personalizados.</p>
          <strong>Personalizado</strong>
        </div>
      </div>
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
          <Route path="/membresias" element={<Membresias />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/quienes-somos" element={<QuienesSomos />} />
          <Route path="/historia" element={<Historia />} />
          <Route path="/planes" element={<Planes />} />
          <Route path="/acceder" element={<Acceder />} />
        </Routes>
      </div>
    </>
  );
}

export default App;