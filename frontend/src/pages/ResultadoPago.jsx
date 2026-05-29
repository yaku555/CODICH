import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Pagar.css';

export default function ResultadoPago() {
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token_ws');

    if (!token) {
      setResultado({ exito: false, cancelado: true });
      setCargando(false);
      return;
    }

    fetch('http://localhost:4000/api/pagos/confirmar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token_ws: token }),
    })
      .then((res) => res.json())
      .then((data) => {
        setResultado(data);
        setCargando(false);
      })
      .catch(() => {
        setResultado({ exito: false, error: 'Error al confirmar el pago.' });
        setCargando(false);
      });
  }, []);

  if (cargando) {
    return (
      <main className="pagar-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="resumen-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ color: '#071d3a', margin: '0 0 8px' }}>Procesando pago...</h2>
          <p style={{ color: '#64748b', margin: 0 }}>Estamos confirmando tu transacción con Transbank.</p>
        </div>
      </main>
    );
  }

  if (resultado?.exito) {
    return (
      <main className="pagar-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="resumen-card" style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#071d3a', margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 800 }}>
            ¡Pago exitoso!
          </h2>
          <p style={{ color: '#64748b', margin: '0 0 24px' }}>
            Tu membresía ha sido activada correctamente. Recibirás un comprobante en tu correo.
          </p>

          {resultado.detalle && (
            <div style={{ textAlign: 'left', marginBottom: '24px' }}>
              <div className="resumen-fila">
                <span>Orden de compra</span>
                <strong>{resultado.detalle.buy_order || '—'}</strong>
              </div>
              <div className="resumen-fila">
                <span>Monto pagado</span>
                <strong className="resumen-monto">
                  {resultado.detalle.amount
                    ? resultado.detalle.amount.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })
                    : '—'}
                </strong>
              </div>
              <div className="resumen-fila">
                <span>Fecha</span>
                <strong>{resultado.detalle.transaction_date
                  ? new Date(resultado.detalle.transaction_date).toLocaleString('es-CL')
                  : new Date().toLocaleString('es-CL')}</strong>
              </div>
            </div>
          )}

          <button className="btn-pagar" onClick={() => navigate('/miembros')}>
            Ir a mi perfil
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="pagar-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="resumen-card" style={{ textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>
          {resultado?.cancelado ? '🚫' : '❌'}
        </div>
        <h2 style={{ color: '#071d3a', margin: '0 0 8px', fontSize: '1.8rem', fontWeight: 800 }}>
          {resultado?.cancelado ? 'Pago cancelado' : 'Pago rechazado'}
        </h2>
        <p style={{ color: '#64748b', margin: '0 0 24px' }}>
          {resultado?.cancelado
            ? 'Cancelaste el proceso de pago. Puedes intentarlo nuevamente cuando quieras.'
            : 'La transacción no pudo ser procesada. Verifica tus datos e intenta nuevamente.'}
        </p>
        <button className="btn-pagar" onClick={() => navigate('/pagar')}>
          Volver a intentar
        </button>
      </div>
    </main>
  );
}