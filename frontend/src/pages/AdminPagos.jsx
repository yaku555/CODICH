import { useEffect, useState } from 'react';
import '../styles/AdminUsuarios.css';

const ESTADO_PAGO = {
  AUTHORIZED: { label: 'Aprobado', clase: 'rol-aprobada' },
  FAILED: { label: 'Rechazado', clase: 'rol-badge' },
  CANCELLED: { label: 'Cancelado', clase: 'rol-por-hacer' },
  PENDING: { label: 'Pendiente', clase: 'rol-por-hacer' },
};

function formatMonto(monto) {
  return Number(monto || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
}

function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-CL');
}

export default function AdminPagos() {
  const [pagos, setPagos] = useState([]);
  const [membresias, setMembresias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      const [pagosRes, membresiasRes] = await Promise.all([
        fetch('http://localhost:4000/api/pagos/historial'),
        fetch('http://localhost:4000/api/pagos/membresias'),
      ]);

      setPagos(await pagosRes.json());
      setMembresias(await membresiasRes.json());
    } catch (err) {
      setError('No se pudo cargar la informacion de pagos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const totalAprobado = pagos
    .filter((p) => p.estado === 'AUTHORIZED')
    .reduce((sum, p) => sum + (p.monto || 0), 0);

  const pagosFiltrados = pagos.filter((pago) => {
    const texto = `${pago.ordenCompra} ${pago.rutSocio} ${pago.plan} ${pago.estado}`;
    return texto.toLowerCase().includes(busqueda.toLowerCase());
  });

  if (loading) {
    return <main className="admin-page"><p className="admin-loading">Cargando pagos...</p></main>;
  }

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="admin-subtitulo">Panel de administracion</p>
          <h1>Pagos y membresias</h1>
        </div>
        <div className="admin-acciones">
          <span className="admin-contador">{pagos.length} transacciones</span>
          <span className="admin-contador" style={{ background: '#166534' }}>
            Total aprobado: {formatMonto(totalAprobado)}
          </span>
        </div>
      </section>

      <section className="admin-card" style={{ marginBottom: '24px' }}>
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

        <div className="tabla-contenedor">
          <table className="usuarios-tabla">
            <thead>
              <tr>
                <th>Indicador</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Membresias activas</strong></td>
                <td>{membresias.filter((m) => m.estado === 'ACTIVA').length}</td>
              </tr>
              <tr>
                <td><strong>Membresias pendientes</strong></td>
                <td>{membresias.filter((m) => m.estado === 'PENDIENTE').length}</td>
              </tr>
              <tr>
                <td><strong>Pagos aprobados</strong></td>
                <td>{pagos.filter((p) => p.estado === 'AUTHORIZED').length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-card">
        <h2 style={{ marginTop: 0 }}>Historial de transacciones WebPay</h2>
        {pagosFiltrados.length === 0 ? (
          <p className="admin-vacio">No hay pagos registrados.</p>
        ) : (
          <div className="tabla-contenedor">
            <table className="usuarios-tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Orden</th>
                  <th>RUT socio</th>
                  <th>Plan</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.map((pago) => {
                  const badge = ESTADO_PAGO[pago.estado] || ESTADO_PAGO.PENDING;
                  return (
                    <tr key={pago._id}>
                      <td>{formatFecha(pago.fecha)}</td>
                      <td><code style={{ fontSize: '0.82rem' }}>{pago.ordenCompra}</code></td>
                      <td>{pago.rutSocio}</td>
                      <td><strong>{pago.plan}</strong></td>
                      <td><strong>{formatMonto(pago.monto)}</strong></td>
                      <td><span className={`rol-badge ${badge.clase}`}>{badge.label}</span></td>
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
