import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsuario } from '../context/usuario.context';
import '../styles/Pagar.css';

const PLANES = [
  {
    id: 'anual',
    nombre: 'Membresía Anual',
    monto: 120000,
    descripcion: 'Acceso completo por 12 meses. Incluye todos los beneficios del gremio.',
    destacado: true,
    beneficios: ['Acceso a red profesional', 'Comprobante digital', 'Voto en asambleas', 'Descuentos en eventos'],
  },
  {
    id: 'semestral',
    nombre: 'Membresía Semestral',
    monto: 65000,
    descripcion: 'Acceso completo por 6 meses.',
    destacado: false,
    beneficios: ['Acceso a red profesional', 'Comprobante digital', 'Descuentos en eventos'],
  },
  {
    id: 'cuota',
    nombre: 'Cuota Mensual',
    monto: 12000,
    descripcion: 'Pago mensual de mantención de membresía activa.',
    destacado: false,
    beneficios: ['Mantención de membresía', 'Comprobante digital'],
  },
];

function formatMonto(monto) {
  return monto.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
}

export default function Pagar() {
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { usuario } = useUsuario();

  const handlePagar = async () => {
    if (!planSeleccionado) return;
    setCargando(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:4000/api/pagos/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: planSeleccionado.monto,
          rutSocio: usuario?.rut || 'invitado',
          plan: planSeleccionado.nombre,
        }),
      });

      const data = await response.json();

      if (data.url && data.token) {
        window.location.href = `${data.url}?token_ws=${data.token}`;
      } else {
        setError('No se pudo iniciar el pago. Intenta nuevamente.');
      }
    } catch (err) {
      setError('Error de conexión con el servidor. Verifica que el backend esté activo.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="pagar-page">
      <section className="pagar-header">
        <p className="pagar-eyebrow">CODICH</p>
        <h1>Pago de Membresía</h1>
        <p className="pagar-subtitulo">
          Selecciona el plan que mejor se adapta a ti y paga de forma segura con WebPay.
        </p>
      </section>

      <section className="pagar-planes">
        {PLANES.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${plan.destacado ? 'plan-destacado' : ''} ${planSeleccionado?.id === plan.id ? 'plan-activo' : ''}`}
            onClick={() => setPlanSeleccionado(plan)}
          >
            {plan.destacado && <span className="plan-badge">Más popular</span>}
            <h3>{plan.nombre}</h3>
            <p className="plan-monto">{formatMonto(plan.monto)}</p>
            <p className="plan-desc">{plan.descripcion}</p>
            <ul className="plan-beneficios">
              {plan.beneficios.map((b) => (
                <li key={b}>✓ {b}</li>
              ))}
            </ul>
            <button
              className={`plan-btn ${planSeleccionado?.id === plan.id ? 'plan-btn-activo' : ''}`}
              onClick={(e) => { e.stopPropagation(); setPlanSeleccionado(plan); }}
            >
              {planSeleccionado?.id === plan.id ? 'Seleccionado ✓' : 'Seleccionar'}
            </button>
          </div>
        ))}
      </section>

      {planSeleccionado && (
        <section className="pagar-resumen">
          <div className="resumen-card">
            <h3>Resumen del pago</h3>
            <div className="resumen-fila">
              <span>Plan seleccionado</span>
              <strong>{planSeleccionado.nombre}</strong>
            </div>
            <div className="resumen-fila">
              <span>Monto a pagar</span>
              <strong className="resumen-monto">{formatMonto(planSeleccionado.monto)}</strong>
            </div>
            <div className="resumen-fila">
              <span>Método de pago</span>
              <strong>WebPay Plus (Transbank)</strong>
            </div>

            {error && <p className="pagar-error">{error}</p>}

            <button
              className="btn-pagar"
              onClick={handlePagar}
              disabled={cargando}
            >
              {cargando ? 'Redirigiendo a WebPay...' : `Pagar ${formatMonto(planSeleccionado.monto)}`}
            </button>

            <p className="pagar-seguro">
               Pago seguro procesado por Transbank. No almacenamos datos de tu tarjeta.
            </p>
          </div>
        </section>
      )}

      <section className="pagar-info">
        <div className="info-item">
          <span className="info-icono"></span>
          <div>
            <strong>Pago 100% seguro</strong>
            <p>Procesado por WebPay Plus de Transbank bajo protocolo TLS.</p>
          </div>
        </div>
        <div className="info-item">
          <span className="info-icono"></span>
          <div>
            <strong>Comprobante inmediato</strong>
            <p>Recibirás tu comprobante digital al correo registrado.</p>
          </div>
        </div>
        <div className="info-item">
          <span className="info-icono"></span>
          <div>
            <strong>Activación instantánea</strong>
            <p>Tu membresía se activa automáticamente tras el pago.</p>
          </div>
        </div>
      </section>
    </main>
  );
}