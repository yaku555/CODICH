import { useEffect, useState } from 'react';
import '../styles/AdminUsuarios.css';

const ESTADO_BADGE = {
  AUTHORIZED: { label: 'Aprobado',  clase: 'rol-aprobada' },
  FAILED:     { label: 'Rechazado', clase: 'rol-badge' },
  CANCELLED:  { label: 'Cancelado', clase: 'rol-por-hacer' },
  PENDING:    { label: 'Pendiente', clase: 'rol-por-hacer' },
};

function formatMonto(monto) {
  return Number(monto).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
}

function formatFecha(fecha) {
  return new Date(fecha).toLocaleString('es-CL');
}

export default function AdminPagos() {
  const [pagos, setPagos]       = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    fetch('http://localhost:4000/api/pagos/historial')
      .then((r) => r.json())
      .then((data) => { setPagos(data); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar los pagos.'); setLoading(false); });
  }, []);

  const total = pagos
    .filter((p) => p.estado === 'AUTHORIZED')
    .reduce((sum, p) => sum + (p.monto || 0), 0);

  const pagosFiltrados = pagos.filter((p) => {
    const texto = `${p.ordenCompra} ${p.rutSocio} ${p.plan} ${p.estado}`;
    return texto.toLowerCase().includes(busqueda.toLowerCase());
  });

  if (loading) {
    return <main className="admin-page"><p className="admin-loading">Cargando pagos...</p></main>;
  }

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="admin-subtitulo">Panel de administración</p>
          <h1>Historial de Pagos</h1>
        </div>
        <div className="admin-acciones">
          <span className="admin-contador">{pagos.length} transacciones</span>
          <span className="admin-contador" style={{ background: '#166534' }}>
            Total aprobado: {formatMonto(total)}
          </span>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-toolbar">
          <input
            type="text"
            placeholder="Buscar por orden, RUT, plan o estado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="admin-buscador"
          />
        </div>

        {error && <p className="admin-error">{error}</p>}

        {pagosFiltrados.length === 0 ? (
          <p className="admin-vacio">No hay pagos registrados.</p>
        ) : (
          <div className="tabla-contenedor">
            <table className="usuarios-tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Orden de compra</th>
                  <th>RUT socio</th>
                  <th>Plan</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.map((pago) => {
                  const badge = ESTADO_BADGE[pago.estado] || ESTADO_BADGE.PENDING;
                  return (
                    <tr key={pago._id}>
                      <td>{formatFecha(pago.fecha)}</td>
                      <td><code style={{ fontSize: '0.82rem' }}>{pago.ordenCompra}</code></td>
                      <td>{pago.rutSocio}</td>
                      <td><strong>{pago.plan}</strong></td>
                      <td><strong>{formatMonto(pago.monto)}</strong></td>
                      <td>
                        <span className={`rol-badge ${badge.clase}`}>{badge.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
