import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUsuario } from '../context/usuario.context';
import { OPCIONES_MEMBRESIA, PLANES_PRINCIPALES, formatMonto } from '../data/planesMembresia';
import '../styles/PagUsuario.css';

function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-CL');
}

function PagMiembros() {
  const { usuario, loading, logout } = useUsuario();
  const [planActivo, setPlanActivo] = useState('mensual');
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null);
  const [cuotas, setCuotas] = useState([]);
  const [cargandoPago, setCargandoPago] = useState(false);
  const [cargandoCuotas, setCargandoCuotas] = useState(false);
  const [errorPago, setErrorPago] = useState('');
  const navigate = useNavigate();

  const nombreCompleto = `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim();

  const opcionesDelPlan = useMemo(
    () => OPCIONES_MEMBRESIA.filter((opcion) => opcion.planId === planActivo),
    [planActivo]
  );

  const cuotasPendientes = cuotas.filter((cuota) =>
    ['PENDIENTE', 'VENCIDA'].includes(cuota.estado)
  );

  useEffect(() => {
    setOpcionSeleccionada(opcionesDelPlan[0] || null);
  }, [opcionesDelPlan]);

  useEffect(() => {
    if (!usuario?.rut) return;

    const cargarCuotas = async () => {
      try {
        setCargandoCuotas(true);
        const response = await fetch(
          `http://localhost:4000/api/pagos/cuotas?rut=${encodeURIComponent(usuario.rut)}`
        );
        const data = await response.json();
        setCuotas(Array.isArray(data) ? data : []);
      } catch (error) {
        setCuotas([]);
      } finally {
        setCargandoCuotas(false);
      }
    };

    cargarCuotas();
  }, [usuario?.rut]);

  const cerrarSesion = () => {
    logout();
    navigate('/acceder', { replace: true });
  };

  const iniciarPago = async (payload) => {
    if (!usuario?.rut) {
      setErrorPago('Debes iniciar sesion para pagar tu membresia.');
      return;
    }

    try {
      setCargandoPago(true);
      setErrorPago('');

      const response = await fetch('http://localhost:4000/api/pagos/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rutSocio: usuario.rut,
          ...payload,
        }),
      });

      const data = await response.json();

      if (data.url && data.token) {
        window.location.href = `${data.url}?token_ws=${data.token}`;
        return;
      }

      setErrorPago(data.error || 'No se pudo iniciar el pago.');
    } catch (error) {
      setErrorPago('Error de conexion con el servidor. Verifica que el backend este activo.');
    } finally {
      setCargandoPago(false);
    }
  };

  const pagarNuevaMembresia = () => {
    if (!opcionSeleccionada) return;

    iniciarPago({
      planId: opcionSeleccionada.planId,
      modalidad: opcionSeleccionada.modalidad,
    });
  };

  const pagarCuota = (cuota) => {
    iniciarPago({ cuotaId: cuota._id });
  };

  if (loading) {
    return (
      <main className="perfil-page">
        <section className="perfil-card">
          <p className="perfil-loading">Cargando datos del perfil...</p>
        </section>
      </main>
    );
  }

  if (!usuario) {
    return <Navigate to="/acceder" replace />;
  }

  return (
    <main className="perfil-page">
      <section className="perfil-header">
        <div>
          <p className="perfil-subtitulo">Panel de Socio Activo</p>
          <h1>Tu informacion</h1>
        </div>

        <button className="btn-cerrar-sesion" onClick={cerrarSesion}>
          Cerrar sesion
        </button>
      </section>

      <section className="perfil-card">
        <div className="perfil-user-top">
          <div className="perfil-avatar">
            {usuario.nombre?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          <div>
            <h2>{nombreCompleto || 'Usuario'}</h2>
            <p>{usuario.email || 'Correo no especificado'}</p>
          </div>
        </div>

        <div className="perfil-grid">
          <div className="perfil-dato">
            <span>Nombre</span>
            <strong>{usuario.nombre || 'No especificado'}</strong>
          </div>

          <div className="perfil-dato">
            <span>Apellido</span>
            <strong>{usuario.apellido || 'No especificado'}</strong>
          </div>

          <div className="perfil-dato">
            <span>RUT</span>
            <strong>{usuario.rut || 'No especificado'}</strong>
          </div>

          <div className="perfil-dato">
            <span>Correo electronico</span>
            <strong>{usuario.email || 'No especificado'}</strong>
          </div>

          <div className="perfil-dato">
            <span>Telefono</span>
            <strong>{usuario.telefono || 'No especificado'}</strong>
          </div>

          <div className="perfil-dato">
            <span>Profesion</span>
            <strong>{usuario.profesion || 'No especificado'}</strong>
          </div>

          <div className="perfil-dato">
            <span>Rol en la plataforma</span>
            <strong>{usuario.rol || 'No especificado'}</strong>
          </div>
        </div>
      </section>

      <section className="perfil-card perfil-pagos-card">
        <div className="perfil-section-head">
          <div>
            <p className="perfil-subtitulo">Membresia</p>
            <h2>Pagos disponibles</h2>
          </div>
          <span className="perfil-pill">WebPay Plus</span>
        </div>

        {errorPago && <p className="perfil-error">{errorPago}</p>}

        <div className="perfil-pago-bloque">
          <h3>Mis cuotas pendientes</h3>
          {cargandoCuotas ? (
            <p className="perfil-muted">Cargando cuotas...</p>
          ) : cuotasPendientes.length === 0 ? (
            <p className="perfil-muted">No tienes cuotas pendientes o vencidas.</p>
          ) : (
            <div className="perfil-cuotas-lista">
              {cuotasPendientes.map((cuota) => (
                <div key={cuota._id} className="perfil-cuota-item">
                  <div>
                    <strong>Cuota {cuota.numero}/{cuota.totalCuotas}</strong>
                    <span>
                      {cuota.membresiaId?.planNombre || 'Membresia'} · vence {formatFecha(cuota.fechaVencimiento)}
                    </span>
                  </div>
                  <div className="perfil-cuota-accion">
                    <strong>{formatMonto(cuota.monto)}</strong>
                    <button
                      className="btn-perfil-pago"
                      onClick={() => pagarCuota(cuota)}
                      disabled={cargandoPago}
                    >
                      Pagar cuota
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="perfil-pago-bloque">
          <h3>Contratar una membresia</h3>
          <div className="perfil-plan-tabs">
            {PLANES_PRINCIPALES.map((plan) => (
              <button
                key={plan.id}
                className={planActivo === plan.id ? 'perfil-tab activo' : 'perfil-tab'}
                onClick={() => setPlanActivo(plan.id)}
              >
                {plan.nombre}
              </button>
            ))}
          </div>

          <div className="perfil-opciones-pago">
            {opcionesDelPlan.map((opcion) => (
              <button
                key={opcion.id}
                className={opcionSeleccionada?.id === opcion.id ? 'perfil-opcion activa' : 'perfil-opcion'}
                onClick={() => setOpcionSeleccionada(opcion)}
              >
                <span>{opcion.nombre}</span>
                <strong>{opcion.cuotas > 1 ? `${opcion.cuotas} cuotas` : 'Pago unico'}</strong>
                <small>{opcion.subtitulo}</small>
              </button>
            ))}
          </div>

          {opcionSeleccionada && (
            <div className="perfil-resumen-pago">
              <div>
                <span>Pagas hoy</span>
                <strong>{formatMonto(opcionSeleccionada.monto)}</strong>
              </div>
              <div>
                <span>Total compromiso</span>
                <strong>{formatMonto(opcionSeleccionada.total)}</strong>
              </div>
              <div>
                <span>Cuotas programadas</span>
                <strong>{opcionSeleccionada.cuotas}</strong>
              </div>
              {opcionSeleccionada.ahorro && (
                <div>
                  <span>Ahorro vs mensual</span>
                  <strong>{formatMonto(opcionSeleccionada.ahorro)}</strong>
                </div>
              )}
            </div>
          )}

          {opcionSeleccionada?.modalidad === 'cuotas' && (
            <p className="perfil-aviso">
              Esta modalidad genera cuotas programadas. Si una cuota vence y supera los dias de gracia, la membresia puede quedar morosa.
            </p>
          )}

          <button
            className="btn-perfil-pago btn-perfil-pago-principal"
            onClick={pagarNuevaMembresia}
            disabled={cargandoPago || !opcionSeleccionada}
          >
            {cargandoPago ? 'Redirigiendo a WebPay...' : 'Pagar membresia'}
          </button>
        </div>
      </section>
    </main>
  );
}

export default PagMiembros;
