import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUsuario } from '../context/usuario.context';
import { actualizarUsuario, getUsuarioPorRut } from '../api/usuarios';
import Comprobantes from '../components/comprobantes.jsx';
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

  const fechaValida = new Date(fecha);

  if (Number.isNaN(fechaValida.getTime())) {
    return 'No especificada';
  }

  return fechaValida.toLocaleDateString('es-CL', {
    timeZone: 'UTC',
  });
};

const formatearFechaInput = (fecha) => {
  if (!fecha) return '';

  const fechaValida = new Date(fecha);

  if (Number.isNaN(fechaValida.getTime())) {
    return '';
  }

  return fechaValida.toISOString().split('T')[0];
};

const formatearRol = (rol) => {
  if (!rol) return 'No especificado';

  const roles = {
    usuario: 'Usuario',
    admin: 'Administrador',
    administrador: 'Administrador',
    soporte: 'Soporte técnico',
    soporte_tecnico: 'Soporte técnico',
  };

  return roles[rol.toLowerCase()] || rol;
};

const obtenerTextoArea = (areaFormacion) => {
  if (!areaFormacion) return 'No especificada';

  const areas = {
    educacion_pedagogia: 'Educación / Pedagogía',
    educacion: 'Educación / Pedagogía',
    pedagogia: 'Educación / Pedagogía',
    otra_area: 'Otra área',
  };

  return areas[areaFormacion.toLowerCase()] || areaFormacion;
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

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    fechaNacimiento: '',
    email: '',
    telefono: '',
    profesion: '',
    residencia: '',
    areaFormacion: '',
    rol: '',
    password: '',
  });

  const [guardando, setGuardando] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState('');
  const [exitoPerfil, setExitoPerfil] = useState('');

  const [membresiaActiva, setMembresiaActiva] = useState(null);
  const [cargandoMembresia, setCargandoMembresia] = useState(false);
  const [confirmandoCancelacion, setConfirmandoCancelacion] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [mensajeCancelacion, setMensajeCancelacion] = useState('');

  const [planActivo, setPlanActivo] = useState('mensual');
  const [showSelector, setShowSelector] = useState(false);
  const [cargandoPago, setCargandoPago] = useState(false);
  const [errorPago, setErrorPago] = useState('');
  const [comprobanteMembresia, setComprobanteMembresia] = useState(null);

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
    const cargarPerfilActualizado = async () => {
      if (!usuario?.rut) return;

      try {
        const usuarioActualizado = await getUsuarioPorRut(usuario.rut);

        setUsuario(usuarioActualizado);
        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));

        setForm({
          nombre: usuarioActualizado.nombre || '',
          apellido: usuarioActualizado.apellido || '',
          rut: usuarioActualizado.rut || '',
          fechaNacimiento: formatearFechaInput(usuarioActualizado.fechaNacimiento),
          email: usuarioActualizado.email || '',
          telefono: usuarioActualizado.telefono || '',
          profesion: usuarioActualizado.profesion || '',
          residencia: usuarioActualizado.residencia || '',
          areaFormacion: usuarioActualizado.areaFormacion || '',
          rol: usuarioActualizado.rol || '',
          password: '',
        });
      } catch (error) {
        console.error('No se pudo cargar el perfil actualizado:', error);

        setForm({
          nombre: usuario.nombre || '',
          apellido: usuario.apellido || '',
          rut: usuario.rut || '',
          fechaNacimiento: formatearFechaInput(usuario.fechaNacimiento),
          email: usuario.email || '',
          telefono: usuario.telefono || '',
          profesion: usuario.profesion || '',
          residencia: usuario.residencia || '',
          areaFormacion: usuario.areaFormacion || '',
          rol: usuario.rol || '',
          password: '',
        });
      }
    };

    cargarPerfilActualizado();
  }, [usuario?.rut]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    let nuevoValor = value;

    // Teléfono: solo permite números y máximo 9 dígitos
    if (name === 'telefono') {
      nuevoValor = value.replace(/\D/g, '').slice(0, 9);
    }

    // Profesión y residencia: no permite números
    if (name === 'profesion' || name === 'residencia') {
      nuevoValor = value.replace(/[0-9]/g, '');
    }

    setForm((prev) => ({
      ...prev,
      [name]: nuevoValor,
    }));
  };

  const handleGuardar = async (e) => {
    e.preventDefault();

    try {
      setGuardando(true);
      setErrorPerfil('');
      setExitoPerfil('');

      const datos = {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        telefono: form.telefono,
        profesion: form.profesion,
        residencia: form.residencia,
        areaFormacion: form.areaFormacion,
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
      setForm((prev) => ({ ...prev, password: '' }));
    } catch {
      setErrorPerfil('No se pudo actualizar el perfil. Intenta nuevamente.');
    } finally {
      setGuardando(false);
    }
  };

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

  return (
    <main className="perfil-page">
      <section className="perfil-header">
        <div>
          <p className="perfil-subtitulo">Panel de Socio Activo</p>
          <h1>Tu información</h1>
        </div>

        <button className="btn-cerrar-sesion" onClick={cerrarSesion}>
          Cerrar sesión
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
                <span>Fecha de nacimiento</span>
                <strong>{formatearFecha(usuario.fechaNacimiento)}</strong>
              </div>

              <div className="perfil-dato">
                <span>Correo electrónico</span>
                <strong>{usuario.email || 'No especificado'}</strong>
              </div>

              <div className="perfil-dato">
                <span>Teléfono</span>
                <strong>{usuario.telefono || 'No especificado'}</strong>
              </div>

              <div className="perfil-dato">
                <span>Profesión</span>
                <strong>{usuario.profesion || 'No especificado'}</strong>
              </div>

              <div className="perfil-dato">
                <span>Área de formación</span>
                <strong>{obtenerTextoArea(usuario.areaFormacion)}</strong>
              </div>

              <div className="perfil-dato">
                <span>Residencia</span>
                <strong>{usuario.residencia || 'No especificada'}</strong>
              </div>

              <div className="perfil-dato">
                <span>Rol</span>
                <strong>{formatearRol(usuario.rol)}</strong>
              </div>
            </div>

            <button
              className="btn-editar-perfil"
              onClick={() => {
                setExitoPerfil('');
                setErrorPerfil('');
                setEditando(true);
              }}
            >
              Editar perfil
            </button>
          </>
        ) : (
          <form className="perfil-form" onSubmit={handleGuardar}>
            <div className="perfil-form-grid">
              <div className="perfil-form-grupo">
                <label>Nombre</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="perfil-form-grupo">
                <label>Apellido</label>
                <input
                  name="apellido"
                  value={form.apellido}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="perfil-form-grupo">
                <label>RUT</label>
                <input
                  name="rut"
                  value={form.rut}
                  disabled
                  className="perfil-input-disabled"
                />
                <small>El RUT no se puede modificar porque es un identificador único.</small>
              </div>

              <div className="perfil-form-grupo">
                <label>Fecha de nacimiento</label>
                <input
                  name="fechaNacimiento"
                  type="date"
                  value={form.fechaNacimiento}
                  disabled
                  className="perfil-input-disabled"
                />
                <small>La fecha de nacimiento no se puede modificar.</small>
              </div>

              <div className="perfil-form-grupo">
                <label>Correo electrónico</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="perfil-form-grupo">
                <label>Profesión</label>
                <input
                  name="profesion"
                  value={form.profesion}
                  onChange={handleChange}
                />
              </div>

              <div className="perfil-form-grupo">
                <label>Área de formación</label>
                <select
                  name="areaFormacion"
                  value={form.areaFormacion}
                  onChange={handleChange}
                >
                  <option value="">Selecciona un área</option>
                  <option value="educacion_pedagogia">Educación/Pedagogía</option>
                  <option value="otra_area">Otra área</option>
                </select>
              </div>

              <div className="perfil-form-grupo">
                <label>Residencia</label>
                <input
                  name="residencia"
                  value={form.residencia}
                  onChange={handleChange}
                  placeholder="Ej: Santiago"
                />
              </div>

              <div className="perfil-form-grupo">
                <label>Rol</label>
                <input
                  name="rol"
                  value={formatearRol(form.rol)}
                  disabled
                  className="perfil-input-disabled"
                />
                <small>El rol no se puede modificar desde el perfil de usuario.</small>
              </div>

              <div className="perfil-form-grupo">
                <label>
                  Nueva contraseña <span className="perfil-label-opcional">(opcional)</span>
                </label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Dejar en blanco para no cambiar"
                />
              </div>

              <div className="perfil-form-grupo">
                <label>Teléfono</label>
                <input
                  name="telefono"
                  type="text"
                  value={form.telefono}
                  onChange={handleChange}
                  inputMode="numeric"
                  maxLength="9"
                  placeholder="Ej: 912345678"
                />
              </div>
            </div>

            {errorPerfil && <p className="perfil-error">{errorPerfil}</p>}

            <div className="perfil-pago-acciones">
              <button
                type="submit"
                className="btn-perfil-pago btn-perfil-pago-principal"
                disabled={guardando}
              >
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

      {!cargandoMembresia && membresiaActiva && (
        <section className="perfil-card">
          <div className="perfil-section-head">
            <div>
              <p className="perfil-subtitulo">Contrato vigente</p>
              <h2>Mi membresía</h2>
            </div>

            <button
              className="btn-renovar-membresia"
              onClick={() => setComprobanteMembresia(membresiaActiva)}
            >
              Comprobantes de pago
            </button>

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

            <div className="perfil-dato">
              <span>Monto renovación</span>
              <strong>
                {typeof membresiaActiva.montoRenovacion === 'number'
                  ? formatMonto(membresiaActiva.montoRenovacion)
                  : 'No disponible'}
              </strong>
            </div>
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
                <button
                  className="btn-perfil-pago btn-cancelar-confirm"
                  onClick={confirmarCancelacion}
                  disabled={cancelando}
                >
                  {cancelando ? 'Cancelando...' : 'Sí, cancelar membresía'}
                </button>

                <button
                  className="btn-perfil-pago btn-perfil-cancelar"
                  onClick={() => setConfirmandoCancelacion(false)}
                  disabled={cancelando}
                >
                  Volver
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {puedeCrearNuevaMembresia ? (
        <section className="perfil-card perfil-pagos-card">
          <div className="perfil-section-head">
            <div>
              <p className="perfil-subtitulo">Membresía</p>
              <h2>Pagos</h2>
            </div>

            <span className="perfil-pill">WebPay Plus</span>
          </div>

          {errorPago && <p className="perfil-error">{errorPago}</p>}

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
        </section>
      ) : null}

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

            <button
              className="btn-editar-perfil"
              onClick={() => setExitoContacto('')}
            >
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
                  placeholder="Ej: Consulta sobre mi membresía"
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
              <button
                type="submit"
                className="btn-perfil-pago btn-perfil-pago-principal"
                disabled={enviandoContacto}
              >
                {enviandoContacto ? 'Enviando...' : 'Enviar mensaje'}
              </button>
            </div>
          </form>
        )}
      </section>

      <Comprobantes
        comprobante={comprobanteMembresia}
        cerrar={() => setComprobanteMembresia(null)}
      />
    </main>
  );
}

export default PagMiembros;