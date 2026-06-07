import { PLANES_PRINCIPALES, OPCIONES_MEMBRESIA, formatMonto } from '../data/planesMembresia';
import '../styles/Pagar.css';

export default function Pagar() {
  return (
    <main className="pagar-page">
      <section className="pagar-header">
        <p className="pagar-eyebrow">CODICH</p>
        <h1>Membresias CODICH</h1>
        <p className="pagar-subtitulo">
          Conoce las opciones disponibles. El pago se habilita dentro del perfil cuando la postulacion es aprobada.
        </p>
      </section>

      <section className="pagar-planes">
        {PLANES_PRINCIPALES.map((plan) => (
          <div key={plan.id} className="plan-card">
            <p className="plan-subtitulo">Plan {plan.nombre}</p>
            <h3>{plan.nombre}</h3>
            <p className="plan-monto">Desde {formatMonto(plan.precioDesde)}</p>
            <p className="plan-desc">{plan.descripcion}</p>
            <p className="plan-total">{plan.resumen}</p>
          </div>
        ))}
      </section>

      <section className="pagar-resumen">
        <div className="resumen-card resumen-card-amplio">
          <h3>Modalidades de pago</h3>
          {OPCIONES_MEMBRESIA.map((opcion) => (
            <div key={opcion.id} className="resumen-opcion">
              <div>
                <strong>{opcion.nombre}</strong>
                <span>{opcion.subtitulo}</span>
              </div>
              <div>
                <strong>{formatMonto(opcion.monto)}</strong>
                <span>Total: {formatMonto(opcion.total)}</span>
              </div>
            </div>
          ))}

          <p className="pagar-aviso">
            Una vez aprobada tu postulacion, recibiras un correo con tus credenciales de acceso. El pago se realiza desde tu perfil de socio.
          </p>
        </div>
      </section>

      <section className="pagar-info">
        <div className="info-item">
          <span className="info-icono">01</span>
          <div>
            <strong>Postulacion aprobada</strong>
            <p>El administrador aprueba tu solicitud y se crea tu usuario.</p>
          </div>
        </div>
        <div className="info-item">
          <span className="info-icono">02</span>
          <div>
            <strong>Correo de acceso</strong>
            <p>Recibes tus credenciales y la indicacion de pagar desde tu perfil.</p>
          </div>
        </div>
        <div className="info-item">
          <span className="info-icono">03</span>
          <div>
            <strong>Pago WebPay</strong>
            <p>Desde el perfil eliges plan y modalidad para activar tu membresia.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
