import { useEffect, useState } from 'react';
import '../styles/AdminUsuarios.css';

const ESTADO_PAGO = {
  AUTHORIZED: { label: 'Aprobado', clase: 'rol-aprobada' },
  FAILED: { label: 'Rechazado', clase: 'rol-badge' },
  CANCELLED: { label: 'Cancelado', clase: 'rol-por-hacer' },
  PENDING: { label: 'Pendiente', clase: 'rol-por-hacer' },
};

const ESTADO_CUOTA = {
  PAGADA: { label: 'Pagada', clase: 'rol-aprobada' },
  PENDIENTE: { label: 'Pendiente', clase: 'rol-por-hacer' },
  VENCIDA: { label: 'Vencida', clase: 'rol-admin' },
  CANCELADA: { label: 'Cancelada', clase: 'rol-badge' },
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
  const [cuotas, setCuotas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      const [pagosRes, membresiasRes, cuotasRes] = await Promise.all([
        fetch('http://localhost:4000/api/pagos/historial'),
        fetch('http://localhost:4000/api/pagos/membresias'),
        fetch('http://localhost:4000/api/pagos/cuotas'),
      ]);

      setPagos(await pagosRes.json());
      setMembresias(await membresiasRes.json());
      setCuotas(await cuotasRes.json());
    } catch (err) {
      setError('No se pudo cargar la informacion de pagos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const revisarMorosidad = async () => {
    try {
      setMensaje('');
      const response = await fetch('http://localhost:4000/api/pagos/morosidad/revisar', {
        method: 'POST',
      });
      const data = await response.json();
      setMensaje(`${data.mensaje}: ${data.cuotasVencidas} cuotas vencidas, ${data.membresiasMorosas} membresias morosas.`);
      cargarDatos();
    } catch (err) {
      setError('No se pudo ejecutar la revision de morosidad.');
    }
  };

  const totalAprobado = pagos
    .filter((p) => p.estado === 'AUTHORIZED')
    .reduce((sum, p) => sum + (p.monto || 0), 0);

  const cuotasVencidas = cuotas.filter((cuota) => cuota.estado === 'VENCIDA').length;
  const membresiasMorosas = membresias.filter((membresia) => membresia.estado === 'MOROSA').length;

  const pagosFiltrados = pagos.filter((pago) => {
    const texto = `${pago.ordenCompra} ${pago.rutSocio} ${pago.plan} ${pago.estado} ${pago.modalidad}`;
    return texto.toLowerCase().includes(busqueda.toLowerCase());
  });

  const cuotasFiltradas = cuotas.filter((cuota) => {
    const plan = cuota.membresiaId?.planNombre || '';
    const texto = `${cuota.rutSocio} ${cuota.estado} ${plan} ${cuota.numero}`;
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
          <h1>Pagos, cuotas y morosidad</h1>
        </div>
        <div className="admin-acciones">
          <span className="admin-contador">{pagos.length} transacciones</span>
          <span className="admin-contador" style={{ background: '#166534' }}>
            Total aprobado: {formatMonto(totalAprobado)}
          </span>
          <button className="btn-crear" onClick={revisarMorosidad}>
            Revisar morosidad
          </button>
        </div>
      </section>

      <section className="admin-card" style={{ marginBottom: '24px' }}>
        <div className="admin-toolbar">
          <input
            type="text"
            placeholder="Buscar por orden, RUT, plan, modalidad o estado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="admin-buscador"
          />
        </div>

        {mensaje && <p className="admin-exito">{mensaje}</p>}
        {error && <p className="admin-error">{error}</p>}

        <div className="tabla-contenedor">
          <table className="usuarios-tabla">
            <thead>
              <tr>
                <th>Indicador</th>
                <th>Valor</th>
                <th>Descripcion</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Membresias activas</strong></td>
                <td>{membresias.filter((m) => m.estado === 'ACTIVA').length}</td>
                <td>Contratos con al menos una cuota pagada.</td>
              </tr>
              <tr>
                <td><strong>Membresias morosas</strong></td>
                <td>{membresiasMorosas}</td>
                <td>Contratos con cuotas vencidas despues de los dias de gracia.</td>
              </tr>
              <tr>
                <td><strong>Cuotas vencidas</strong></td>
                <td>{cuotasVencidas}</td>
                <td>Cuotas pendientes que ya superaron la fecha de vencimiento.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-card" style={{ marginBottom: '24px' }}>
        <h2 style={{ marginTop: 0 }}>Cuotas programadas</h2>
        {cuotasFiltradas.length === 0 ? (
          <p className="admin-vacio">No hay cuotas registradas.</p>
        ) : (
          <div className="tabla-contenedor">
            <table className="usuarios-tabla">
              <thead>
                <tr>
                  <th>Vence</th>
                  <th>RUT socio</th>
                  <th>Plan</th>
                  <th>Cuota</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {cuotasFiltradas.map((cuota) => {
                  const badge = ESTADO_CUOTA[cuota.estado] || ESTADO_CUOTA.PENDIENTE;
                  return (
                    <tr key={cuota._id}>
                      <td>{formatFecha(cuota.fechaVencimiento)}</td>
                      <td>{cuota.rutSocio}</td>
                      <td><strong>{cuota.membresiaId?.planNombre || '-'}</strong></td>
                      <td>{cuota.numero}/{cuota.totalCuotas}</td>
                      <td><strong>{formatMonto(cuota.monto)}</strong></td>
                      <td><span className={`rol-badge ${badge.clase}`}>{badge.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
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
                  <th>Cuota</th>
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
                      <td>{pago.numeroCuota}/{pago.totalCuotas}</td>
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
