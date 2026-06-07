import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUsuario } from '../context/usuario.context';
import { actualizarUsuario } from '../api/usuarios';
import { OPCIONES_MEMBRESIA, PLANES_PRINCIPALES, formatMonto } from '../data/planesMembresia';
import '../styles/PagUsuario.css';

function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleDateString('es-CL');
}

function PagMiembros() {
  const { usuario, setUsuario, loading, logout } = useUsuario();
  const navigate = useNavigate();

  // --- Edición de perfil ---
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '', profesion: '', password: '' });
  const [guardando, setGuardando] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState('');
  const [exitoPerfil, setExitoPerfil] = useState('');

  // --- Pagos ---
  const [planActivo, setPlanActivo] = useState('mensual');
  const [modalidadActiva, setModalidadActiva] = useState('contado');
  const [showSelector, setShowSelector] = useState(false);
  const [cuotas, setCuotas] = useState([]);
  const [cargandoPago, setCargandoPago] = useState(false);
  const [cargandoCuotas, setCargandoCuotas] = useState(false);
  const [errorPago, setErrorPago] = useState('');

  const nombreCompleto = `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim();

  const cuotasPendientes = cuotas.filter((c) => ['PENDIENTE', 'VENCIDA'].includes(c.estado));

  const opcionSeleccionada =
    OPCIONES_MEMBRESIA.find((o) => o.planId === planActivo && o.modalidad === modalidadActiva) ||
    OPCIONES_MEMBRESIA.find((o) => o.planId === planActivo);

  useEffect(() => {
    if (usuario) {
      setForm({
        nombre: usuario.nombre || '',
        apellido: usuario.apellido || '',
        email: usuario.email || '',
        telefono: usuario.telefono || '',
        profesion: usuario.profesion || '',
        password: '',
      });
    }
  }, [usuario]);

  useEffect(() => {
    if (!usuario?.rut) return;
    const cargarCuotas = async () => {
      try {
        setCargandoCuotas(true);
        const res = await fetch(`http://localhost:4000/api/pagos/cuotas?rut=${encodeURIComponent(usuario.rut)}`);
        const data = await res.json();
        setCuotas(Array.isArray(data) ? data : []);
      } catch {
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

  // --- Handlers perfil ---
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      setErrorPerfil('');

      const datos = {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        telefono: form.telefono,
        profesion: form.profesion,
      };
      if (form.password.trim()) {
        datos.password = form.password;
      }

      const actualizado = await actualizarUsuario(usuario.rut, datos);
      const usuarioActualizado = { ...usuario, ...actualizado };
      setUsuario(usuarioActualizado);
      localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
      setExitoPerfil('Perfil actualizado correctamente.');
      setEditando(false);
    } catch {
      setErrorPerfil('No se pudo actualizar el perfil. Intenta nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirEdicion = () => {
    setExitoPerfil('');
    setErrorPerfil('');
    setEditando(true);
  };

  // --- Handlers pagos ---
  const iniciarPago = async (payload) => {
    if (!usuario?.rut) {
      setErrorPago('Debes iniciar sesion para pagar tu membresia.');
      return;
    }
    try {
      setCargandoPago(true);
      setErrorPago('');
      const res = await fetch('http://localhost:4000/api/pagos/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rutSocio: usuario.rut, ...payload }),
      });
      const data = await res.json();
      if (data.url && data.token) {
        window.location.href = `${data.url}?token_ws=${data.token}`;
        return;
      }
      setErrorPago(data.error || 'No se pudo iniciar el pago.');
    } catch {
      setErrorPago('Error de conexion con el servidor. Verifica que el backend este activo.');
    } finally {
      setCargandoPago(false);
    }
  };

  const pagarNuevaMembresia = () => {
    if (!opcionSeleccionada) return;
    iniciarPago({ planId: opcionSeleccionada.planId, modalidad: opcionSeleccionada.modalidad });
  };

  const pagarCuota = (cuota) => iniciarPago({ cuotaId: cuota._id });

  const seleccionarPlan = (planId) => {
    setPlanActivo(planId);
    setModalidadActiva('contado');
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

      {/* Tarjeta de perfil */}
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

        {exitoPerfil && <p className="perfil-exito">{exitoPerfil}</p>}

        {!editando ? (
          <>
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

            <button className="btn-editar-perfil" onClick={abrirEdicion}>
              Editar perfil
            </button>
          </>
        ) : (
          <form className="perfil-form" onSubmit={handleGuardar}>
            <div className="perfil-form-grid">
              <div className="perfil-form-grupo">
                <label>Nombre</label>
                <input name="nombre" value={form.nombre} onChange={handleChange} required />
              </div>
              <div className="perfil-form-grupo">
                <label>Apellido</label>
                <input name="apellido" value={form.apellido} onChange={handleChange} required />
              </div>
              <div className="perfil-form-grupo">
                <label>RUT</label>
                <input value={usuario.rut} disabled className="perfil-input-disabled" />
              </div>
              <div className="perfil-form-grupo">
                <label>Correo electronico</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required />
              </div>
              <div className="perfil-form-grupo">
                <label>Telefono</label>
                <input name="telefono" value={form.telefono} onChange={handleChange} />
              </div>
              <div className="perfil-form-grupo">
                <label>Profesion</label>
                <input name="profesion" value={form.profesion} onChange={handleChange} />
              </div>
              <div className="perfil-form-grupo">
                <label>Rol en la plataforma</label>
                <input value={usuario.rol} disabled className="perfil-input-disabled" />
              </div>
              <div className="perfil-form-grupo">
                <label>Nueva contrasena <span className="perfil-label-opcional">(opcional)</span></label>
                <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Dejar en blanco para no cambiar" />
              </div>
            </div>

            {errorPerfil && <p className="perfil-error">{errorPerfil}</p>}

            <div className="perfil-pago-acciones">
              <button type="submit" className="btn-perfil-pago btn-perfil-pago-principal" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                className="btn-perfil-pago btn-perfil-cancelar"
                onClick={() => setEditando(false)}
                disabled={guardando}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Tarjeta de pagos */}
      <section className="perfil-card perfil-pagos-card">
        <div className="perfil-section-head">
          <div>
            <p className="perfil-subtitulo">Membresia</p>
            <h2>Pagos</h2>
          </div>
          <span className="perfil-pill">WebPay Plus</span>
        </div>

        {errorPago && <p className="perfil-error">{errorPago}</p>}

        {(cargandoCuotas || cuotasPendientes.length > 0) && (
          <div className="perfil-pago-bloque">
            <h3>Cuotas pendientes</h3>
            {cargandoCuotas ? (
              <p className="perfil-muted">Cargando cuotas...</p>
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
                      <button className="btn-perfil-pago" onClick={() => pagarCuota(cuota)} disabled={cargandoPago}>
                        Pagar cuota
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="perfil-pago-bloque">
          {!showSelector ? (
            <button className="btn-perfil-pago btn-perfil-pago-principal" onClick={() => setShowSelector(true)}>
              Pagar cuota
            </button>
          ) : (
            <>
              <h3>Elige tu plan</h3>

              <div className="perfil-plan-tabs">
                {PLANES_PRINCIPALES.map((plan) => (
                  <button
                    key={plan.id}
                    className={planActivo === plan.id ? 'perfil-tab activo' : 'perfil-tab'}
                    onClick={() => seleccionarPlan(plan.id)}
                  >
                    {plan.nombre}
                  </button>
                ))}
              </div>

              {planActivo !== 'mensual' && (
                <div className="perfil-plan-tabs" style={{ marginTop: '8px' }}>
                  <button
                    className={modalidadActiva === 'contado' ? 'perfil-tab activo' : 'perfil-tab'}
                    onClick={() => setModalidadActiva('contado')}
                  >
                    Contado
                  </button>
                  <button
                    className={modalidadActiva === 'cuotas' ? 'perfil-tab activo' : 'perfil-tab'}
                    onClick={() => setModalidadActiva('cuotas')}
                  >
                    En cuotas
                  </button>
                </div>
              )}

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
                    <span>Cuotas</span>
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

              <div className="perfil-pago-acciones">
                <button
                  className="btn-perfil-pago btn-perfil-pago-principal"
                  onClick={pagarNuevaMembresia}
                  disabled={cargandoPago || !opcionSeleccionada}
                >
                  {cargandoPago ? 'Redirigiendo a WebPay...' : 'Pagar con WebPay'}
                </button>
                <button
                  className="btn-perfil-pago btn-perfil-cancelar"
                  onClick={() => setShowSelector(false)}
                  disabled={cargandoPago}
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default PagMiembros;
