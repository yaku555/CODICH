import { getUsuarios } from "../api/usuarios";
import { useUsuario } from "../context/usuario.context.jsx"; 


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



export default Inicio;