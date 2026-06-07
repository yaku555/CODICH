import { useState } from "react";
import emailjs from "@emailjs/browser";
import { useUsuario } from "../context/usuario.context.jsx";
import generarComprobantePDF from "../components/crearPDF.jsx";

function Inicio() {
  const { usuarioPrueba, usuario } = useUsuario();
  const [enviando, setEnviando] = useState(false);

  const enviarCorreo = async () => {
    setEnviando(true);

    try {
      await emailjs.send(
        "service_8ry86mp",
        "template_x5it62t",
        {
          name: "Joaquin",
          email: "javierhermosilla17@gmail.com",
          correo: "https://www.youtube.com",
        },
        {
          publicKey: "JC5QAq6AciVrpi5gQ",
        }
      );

      alert("Correo enviado correctamente");
    } catch (error) {
      console.error("Error al enviar correo:", error);
      alert("No se pudo enviar el correo");
    } finally {
      setEnviando(false);
    }
  };


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
          <button className="primary-btn">Ver membresías</button>
          <button className="secondary-btn">Conocer planes</button>

          <button
            className="primary-btn"
            onClick={enviarCorreo}
            disabled={enviando}
          >
            {enviando ? "Enviando..." : "Enviar correo"}
          </button>

          <button
            className="secondary-btn"
            onClick={generarComprobantePDF}
          >
            Descargar comprobante PDF
          </button>
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