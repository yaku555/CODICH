import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUsuario } from '../context/usuario.context';
import { actualizarUsuario } from '../api/usuarios';
import { OPCIONES_MEMBRESIA, PLANES_PRINCIPALES, formatMonto } from '../data/planesMembresia';
import '../styles/PagUsuario.css';
import {
  obtenerMembresiasPorRut,
  iniciarPagoMembresia,
  renovarMembresia,
  cancelarMembresia,
  simularVencimientoMembresia,
  simularRenovacionMembresia,
} from '../api/pagos';

const formatearFecha = (fecha) => {
  if (!fecha) return 'No especificada';

  return new Date(fecha).toLocaleDateString('es-CL', {
    timeZone: 'UTC',
  });
};

const ESTADOS_BLOQUEANTES = [
  'PENDIENTE',
  'ACTIVA',
  'POR_PAGAR',
  'MOROSA',
  'SUSPENDIDA',
];
const CLASE_ESTADO_MEMBRESIA = {
  ACTIVA: 'perfil-pill-activa',
  CANCELADA: 'perfil-pill-cancelada',
  FINALIZADA: 'perfil-pill-cancelada',
  MOROSA: 'perfil-pill-morosa',
  SUSPENDIDA: 'perfil-pill-suspendida',
  PENDIENTE: 'perfil-pill-pendiente',
  POR_PAGAR: 'perfil-pill-por-pagar',
};

const redirigirAWebpay = ({ url, token }) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'token_ws';
  input.value = token;

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
};

function PagMiembros() {
  const { usuario, setUsuario, loading, logout } = useUsuario();
  const navigate = useNavigate();

  // --- Edición de perfil ---
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '', profesion: '', password: '' });
  const [guardando, setGuardando] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState('');
  const [exitoPerfil, setExitoPerfil] = useState('');

  // --- Membresía activa ---
  const [membresiaActiva, setMembresiaActiva] = useState(null);
  const [cargandoMembresia, setCargandoMembresia] = useState(false);
  const [confirmandoCancelacion, setConfirmandoCancelacion] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [mensajeCancelacion, setMensajeCancelacion] = useState('');

  // --- Pagos ---
  const [planActivo, setPlanActivo] = useState('mensual');
  const [showSelector, setShowSelector] = useState(false);
  const [cargandoPago, setCargandoPago] = useState(false);
  const [errorPago, setErrorPago] = useState('');

  // --- Contacto ---
  const [formContacto, setFormContacto] = useState({ asunto: '', mensaje: '' });
  const [enviandoContacto, setEnviandoContacto] = useState(false);
  const [exitoContacto, setExitoContacto] = useState('');
  const [errorContacto, setErrorContacto] = useState('');

  const nombreCompleto = `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim();

  const opcionSeleccionada = OPCIONES_MEMBRESIA.find(
    (o) => o.planId === planActivo && o.modalidad === 'contado'
  );

  const membresiaBloqueante =
    membresiaActiva && ESTADOS_BLOQUEANTES.includes(membresiaActiva.estado);

  const puedeCrearNuevaMembresia = !membresiaBloqueante;

  const puedeRenovar =
    membresiaActiva &&
    membresiaActiva.puedeRenovar &&
    !['CANCELADA', 'FINALIZADA'].includes(membresiaActiva.estado);

  const claseEstado =
    CLASE_ESTADO_MEMBRESIA[membresiaActiva?.estado] || '';

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

  const cargarMembresia = async () => {
    if (!usuario?.rut) return;

    try {
      setCargandoMembresia(true);

      const data = await obtenerMembresiasPorRut(usuario.rut);
      const membresias = Array.isArray(data) ? data : [];

      const membresiaMostrar =
        membresias.find((m) => ESTADOS_BLOQUEANTES.includes(m.estado)) ||
        membresias[0] ||
        null;

      setMembresiaActiva(membresiaMostrar);
    } catch {
      setMembresiaActiva(null);
    } finally {
      setCargandoMembresia(false);
    }
  };

  useEffect(() => {
    cargarMembresia();
  }, [usuario?.rut]);

  const cerrarSesion = () => {
    logout();
    navigate('/acceder', { replace: true });
  };

  // --- Handlers perfil ---
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

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
      if (form.password.trim()) datos.password = form.password;

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

  // --- Handlers membresía ---
  const confirmarCancelacion = async () => {
    if (!membresiaActiva) return;

    try {
      setCancelando(true);

      const data = await cancelarMembresia(membresiaActiva._id);

      setMembresiaActiva(data.membresia || { ...membresiaActiva, estado: 'CANCELADA' });
      setMensajeCancelacion('Membresía cancelada. Puedes contratar una nueva cuando lo desees.');
      setConfirmandoCancelacion(false);
      setShowSelector(false);
    } catch (err) {
      setMensajeCancelacion(
        err.response?.data?.error || 'No se pudo cancelar la membresía.'
      );
    } finally {
      setCancelando(false);
    }
  };

  // --- Handlers pagos ---
  const iniciarPago = async (planId) => {
    if (!usuario?.rut) {
      setErrorPago('Debes iniciar sesión para pagar tu membresía.');
      return;
    }

    if (!puedeCrearNuevaMembresia) {
      setErrorPago('Ya tienes una membresía vigente. No puedes crear otra.');
      return;
    }

    try {
      setCargandoPago(true);
      setErrorPago('');

      const data = await iniciarPagoMembresia({
        rutSocio: usuario.rut,
        planId,
      });

      if (data.url && data.token) {
        redirigirAWebpay(data);
        return;
      }

      setErrorPago(data.error || 'No se pudo iniciar el pago.');
    } catch (err) {
      setErrorPago(
        err.response?.data?.error ||
        'Error de conexión con el servidor. Verifica que el backend esté activo.'
      );
    } finally {
      setCargandoPago(false);
    }
  };

  const renovarPagoMembresia = async () => {
    if (!membresiaActiva?._id) return;

    try {
      setCargandoPago(true);
      setErrorPago('');

      const data = await renovarMembresia(membresiaActiva._id, false);

      if (data.url && data.token) {
        redirigirAWebpay(data);
        return;
      }

      setErrorPago(data.error || 'No se pudo iniciar la renovación.');
    } catch (err) {
      setErrorPago(
        err.response?.data?.error ||
        'No se pudo renovar la membresía.'
      );
    } finally {
      setCargandoPago(false);
    }
  };

  const simularVencimiento = async () => {
    if (!membresiaActiva?._id) return;

    try {
      setCargandoPago(true);
      setErrorPago('');

      await simularVencimientoMembresia(membresiaActiva._id);
      await cargarMembresia();

      setMensajeCancelacion('');
    } catch (err) {
      setErrorPago(
        err.response?.data?.error ||
        'No se pudo simular el vencimiento.'
      );
    } finally {
      setCargandoPago(false);
    }
  };

  const simularRenovacion = async () => {
    if (!membresiaActiva?._id) return;

    try {
      setCargandoPago(true);
      setErrorPago('');

      await simularRenovacionMembresia(membresiaActiva._id);
      await cargarMembresia();

      setMensajeCancelacion('');
    } catch (err) {
      setErrorPago(
        err.response?.data?.error ||
        'No se pudo simular la renovación.'
      );
    } finally {
      setCargandoPago(false);
    }
  };
  // --- Handlers contacto ---
  const enviarConsulta = async (e) => {
    e.preventDefault();
    try {
      setEnviandoContacto(true);
      setErrorContacto('');
      const res = await fetch('http://localhost:4000/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombreCompleto,
          email: usuario.email,
          asunto: formContacto.asunto,
          mensaje: formContacto.mensaje,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setExitoContacto('Tu mensaje fue enviado. Te contactaremos a la brevedad.');
        setFormContacto({ asunto: '', mensaje: '' });
      } else {
        setErrorContacto(data.error || 'No se pudo enviar el mensaje.');
      }
    } catch {
      setErrorContacto('Error de conexión. Intenta nuevamente.');
    } finally {
      setEnviandoContacto(false);
    }
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

  const obtenerTextoArea = (areaFormacion) => {
    if (areaFormacion === 'educacion_pedagogia') {
      return 'Educación / Pedagogía';
    }

    if (areaFormacion === 'otra_area') {
      return 'Otra área';
    }

    return 'No especificada';
  };

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

      {/* Datos del perfil */}
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
              <div className="perfil-dato"><span>Nombre</span><strong>{usuario.nombre || 'No especificado'}</strong></div>
              <div className="perfil-dato"><span>Apellido</span><strong>{usuario.apellido || 'No especificado'}</strong></div>
              <div className="perfil-dato"><span>RUT</span><strong>{usuario.rut || 'No especificado'}</strong></div>
              <div className="perfil-dato"><span>Correo electronico</span><strong>{usuario.email || 'No especificado'}</strong></div>
              <div className="perfil-dato"><span>Telefono</span><strong>{usuario.telefono || 'No especificado'}</strong></div>
              <div className="perfil-dato"><span>Profesion</span><strong>{usuario.profesion || 'No especificado'}</strong></div>
              <div className="perfil-dato">
                <span>Área de formación</span>
                <strong>{obtenerTextoArea(usuario.areaFormacion)}</strong>
              </div>

            </div>
            <button className="btn-editar-perfil" onClick={() => { setExitoPerfil(''); setErrorPerfil(''); setEditando(true); }}>
              Editar perfil
            </button>
          </>
        ) : (
          <form className="perfil-form" onSubmit={handleGuardar}>
            <div className="perfil-form-grid">
              <div className="perfil-form-grupo"><label>Nombre</label><input name="nombre" value={form.nombre} onChange={handleChange} required /></div>
              <div className="perfil-form-grupo"><label>Apellido</label><input name="apellido" value={form.apellido} onChange={handleChange} required /></div>
              <div className="perfil-form-grupo"><label>RUT</label><input value={usuario.rut} disabled className="perfil-input-disabled" /></div>
              <div className="perfil-form-grupo"><label>Correo electronico</label><input name="email" type="email" value={form.email} onChange={handleChange} required /></div>
              <div className="perfil-form-grupo"><label>Telefono</label><input name="telefono" value={form.telefono} onChange={handleChange} /></div>
              <div className="perfil-form-grupo"><label>Profesion</label><input name="profesion" value={form.profesion} onChange={handleChange} /></div>
              <div className="perfil-form-grupo"><label>Rol en la plataforma</label><input value={usuario.rol} disabled className="perfil-input-disabled" /></div>
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
              <button type="button" className="btn-perfil-pago btn-perfil-cancelar" onClick={() => setEditando(false)} disabled={guardando}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Membresía activa */}
      {!cargandoMembresia && membresiaActiva && (
        <section className="perfil-card">
          <div className="perfil-section-head">
            <div>
              <p className="perfil-subtitulo">Contrato vigente</p>
              <h2>Mi membresía</h2>
            </div>
            <span className={`perfil-pill ${claseEstado}`}>
              {membresiaActiva.estado}
            </span>
          </div>

          <div className="perfil-grid">
            <div className="perfil-dato">
              <span>Plan</span>
              <strong>{membresiaActiva.planNombre}</strong>
            </div>

            <div className="perfil-dato">
              <span>Vence</span>
              <strong>{formatearFecha(membresiaActiva.fechaTermino)}</strong>
            </div>

            <div className="perfil-dato">
              <span>Próximo pago</span>
              <strong>{formatearFecha(membresiaActiva.fechaProximoPago)}</strong>
            </div>



            <div className="perfil-dato">
              <span>Pagos asociados</span>
              <strong>{membresiaActiva.pagos?.length || 0}</strong>
            </div>

            {membresiaActiva.codigoMembresia && (
              <div className="perfil-dato">
                <span>Código membresía</span>
                <strong>{membresiaActiva.codigoMembresia}</strong>
              </div>
            )}

            {membresiaActiva && (
              <div className="perfil-dato">
                <span>Monto renovación</span>
                <strong>
                  {typeof membresiaActiva.montoRenovacion === 'number'
                    ? formatMonto(membresiaActiva.montoRenovacion)
                    : 'No disponible'}
                </strong>
              </div>
            )}
          </div>

          {membresiaActiva.esPagoConMora && (
            <div className="perfil-aviso-mora">
              Esta membresía tiene mora. La próxima renovación tendrá un recargo de{' '}
              <strong>{membresiaActiva.porcentajeRecargo}%</strong>, equivalente a{' '}
              <strong>{formatMonto(membresiaActiva.recargoMora)}</strong>. Después de pagar,
              el monto vuelve a la normalidad.
            </div>
          )}
          <div className="perfil-politica">
            <strong>Política de cancelación</strong>
            <p>{membresiaActiva.politicaCancelacion}</p>
          </div>

          {mensajeCancelacion && (
            <p className="perfil-muted perfil-msg-cancelacion">{mensajeCancelacion}</p>
          )}

          {!confirmandoCancelacion && !mensajeCancelacion && (
            <div className="perfil-acciones-membresia">
              {puedeRenovar && (
                <button
                  className="btn-renovar-membresia"
                  onClick={renovarPagoMembresia}
                  disabled={cargandoPago}
                >
                  {cargandoPago ? 'Redirigiendo a WebPay...' : 'Renovar membresía'}
                </button>
              )}

              {!['CANCELADA', 'FINALIZADA'].includes(membresiaActiva.estado) && (
                <button
                  className="btn-cancelar-membresia"
                  onClick={() => setConfirmandoCancelacion(true)}
                  disabled={cargandoPago}
                >
                  Cancelar membresía
                </button>
              )}

              {!['CANCELADA', 'FINALIZADA'].includes(membresiaActiva.estado) && (
                <button
                  className="btn-simular-renovacion"
                  onClick={simularRenovacion}
                  disabled={cargandoPago}
                >
                  Simular renovación
                </button>
              )}

              {!['CANCELADA', 'FINALIZADA'].includes(membresiaActiva.estado) && (
                <button
                  className="btn-simular-membresia"
                  onClick={simularVencimiento}
                  disabled={cargandoPago}
                >
                  Simular vencimiento con mora
                </button>
              )}
            </div>
          )}

          {confirmandoCancelacion && (
            <div className="perfil-confirm-cancel">
              <p>¿Confirmas la cancelación? Esta acción no se puede deshacer y aplica la política indicada arriba.</p>
              <div className="perfil-pago-acciones">
                <button className="btn-perfil-pago btn-cancelar-confirm" onClick={confirmarCancelacion} disabled={cancelando}>
                  {cancelando ? 'Cancelando...' : 'Sí, cancelar membresía'}
                </button>
                <button className="btn-perfil-pago btn-perfil-cancelar" onClick={() => setConfirmandoCancelacion(false)} disabled={cancelando}>
                  Volver
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Pagos */}
      {/* Pagos */}
      <section className="perfil-card perfil-pagos-card">
        <div className="perfil-section-head">
          <div>
            <p className="perfil-subtitulo">Membresía</p>
            <h2>Pagos</h2>
          </div>
          <span className="perfil-pill">WebPay Plus</span>
        </div>

        {errorPago && <p className="perfil-error">{errorPago}</p>}

        {!puedeCrearNuevaMembresia ? (
          <div className="perfil-aviso">
            Ya tienes una membresía en estado <strong>{membresiaActiva.estado}</strong>.
            No puedes crear otra membresía mientras esta siga vigente.
            {puedeRenovar
              ? ' Puedes renovarla desde la sección “Mi membresía”.'
              : ' La opción de renovar aparecerá cuando llegue la fecha de próximo pago.'}
          </div>
        ) : (
          <div className="perfil-pago-bloque">
            {membresiaActiva?.estado === 'CANCELADA' && (
              <p className="perfil-aviso">
                Tu membresía anterior está cancelada. Puedes contratar una nueva.
              </p>
            )}

            {!showSelector ? (
              <button
                className="btn-perfil-pago btn-perfil-pago-principal"
                onClick={() => setShowSelector(true)}
              >
                Crear membresía
              </button>
            ) : (
              <>
                <h3>Elige tu plan</h3>

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

                {opcionSeleccionada && (
                  <div className="perfil-resumen-pago">
                    <div>
                      <span>Monto</span>
                      <strong>{formatMonto(opcionSeleccionada.monto)}</strong>
                    </div>

                    <div>
                      <span>Duración</span>
                      <strong>
                        {planActivo === 'mensual'
                          ? '1 mes'
                          : planActivo === 'trimestral'
                            ? '3 meses'
                            : '12 meses'}
                      </strong>
                    </div>

                    {opcionSeleccionada.ahorro && (
                      <div>
                        <span>Ahorro vs mensual</span>
                        <strong>{formatMonto(opcionSeleccionada.ahorro)}</strong>
                      </div>
                    )}
                  </div>
                )}

                <div className="perfil-pago-acciones">
                  <button
                    className="btn-perfil-pago btn-perfil-pago-principal"
                    onClick={() => iniciarPago(planActivo)}
                    disabled={cargandoPago}
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
        )}
      </section>
      {/* Contacto */}
      <section className="perfil-card">
        <div className="perfil-section-head">
          <div>
            <p className="perfil-subtitulo">Soporte</p>
            <h2>Contactar ejecutivo</h2>
          </div>
        </div>

        {exitoContacto ? (
          <div className="perfil-contacto-exito">
            <p className="perfil-exito">{exitoContacto}</p>
            <button className="btn-editar-perfil" onClick={() => setExitoContacto('')}>
              Enviar otro mensaje
            </button>
          </div>
        ) : (
          <form className="perfil-form" onSubmit={enviarConsulta}>
            <div className="perfil-form-grid">
              <div className="perfil-form-grupo">
                <label>Nombre</label>
                <input value={nombreCompleto} disabled className="perfil-input-disabled" />
              </div>
              <div className="perfil-form-grupo">
                <label>Correo de respuesta</label>
                <input value={usuario.email} disabled className="perfil-input-disabled" />
              </div>
              <div className="perfil-form-grupo perfil-form-full">
                <label>Asunto</label>
                <input
                  value={formContacto.asunto}
                  onChange={(e) => setFormContacto({ ...formContacto, asunto: e.target.value })}
                  placeholder="Ej: Consulta sobre mi membresia"
                  required
                />
              </div>
              <div className="perfil-form-grupo perfil-form-full">
                <label>Mensaje</label>
                <textarea
                  value={formContacto.mensaje}
                  onChange={(e) => setFormContacto({ ...formContacto, mensaje: e.target.value })}
                  placeholder="Describe tu consulta o solicitud..."
                  required
                  rows={4}
                />
              </div>
            </div>

            {errorContacto && <p className="perfil-error">{errorContacto}</p>}

            <div className="perfil-pago-acciones">
              <button type="submit" className="btn-perfil-pago btn-perfil-pago-principal" disabled={enviandoContacto}>
                {enviandoContacto ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

export default PagMiembros;
