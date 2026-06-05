import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { getUsuarioPorRut, actualizarUsuario, borrarUsuario } from '../api/usuarios.js';
import '../styles/AdminUsuarios.css';

function AdminUsuarioDetalle() {
  const { rut } = useParams();
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    email: '',
    telefono: '',
    profesion: '',
    rol: '',
    password: '',
  });

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarUsuario();
  }, [rut]);

  const cargarUsuario = async () => {
    try {
      setLoading(true);
      setError('');

      const usuarioEncontrado = await getUsuarioPorRut(rut);

      setUsuario(usuarioEncontrado);

      setForm({
        nombre: usuarioEncontrado.nombre || '',
        apellido: usuarioEncontrado.apellido || '',
        rut: usuarioEncontrado.rut || '',
        email: usuarioEncontrado.email || '',
        telefono: usuarioEncontrado.telefono || '',
        profesion: usuarioEncontrado.profesion || '',
        rol: usuarioEncontrado.rol || '',
        password: '',
      });
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'No se pudo cargar el usuario.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // El RUT no se modifica porque es identificador único del usuario
    if (name === 'rut') return;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setGuardando(true);
      setMensaje('');
      setError('');

      const datosActualizados = {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        telefono: form.telefono,
        profesion: form.profesion,
        rol: form.rol,
      };

      if (form.password.trim() !== '') {
        datosActualizados.password = form.password;
      }

      // Se usa el RUT de la URL solo para encontrar al usuario.
      // No se envía el RUT como dato editable.
      const usuarioActualizado = await actualizarUsuario(
        rut,
        datosActualizados
      );

      setUsuario(usuarioActualizado);

      setForm({
        nombre: usuarioActualizado.nombre || '',
        apellido: usuarioActualizado.apellido || '',
        rut: usuarioActualizado.rut || '',
        email: usuarioActualizado.email || '',
        telefono: usuarioActualizado.telefono || '',
        profesion: usuarioActualizado.profesion || '',
        rol: usuarioActualizado.rol || '',
        password: '',
      });

      setMensaje('Usuario actualizado correctamente.');
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'No se pudo actualizar el usuario.'
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    const confirmar = window.confirm(
      `¿Seguro que quieres eliminar al usuario ${form.nombre} ${form.apellido} con RUT ${form.rut}?`
    );

    if (!confirmar) return;

    try {
      setEliminando(true);
      setMensaje('');
      setError('');

      // Se usa el RUT de la URL como identificador seguro
      await borrarUsuario(rut);

      sessionStorage.setItem('adminMensaje', 'Usuario eliminado correctamente.');

      navigate('/admin', {
        replace: true,
      });
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'No se pudo eliminar el usuario.'
      );
    } finally {
      setEliminando(false);
    }
  };

  if (loading) {
    return (
      <main className="admin-page">
        <p className="admin-loading">Cargando datos del usuario...</p>
      </main>
    );
  }

  if (!usuario && !error) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="admin-subtitulo">Detalle de usuario</p>
          <h1>Editar usuario</h1>
        </div>

        <Link to="/admin" className="btn-volver">
          Volver a usuarios
        </Link>
      </section>

      <section className="admin-card">
        {error && <p className="admin-error">{error}</p>}
        {mensaje && <p className="admin-exito">{mensaje}</p>}

        <form className="usuario-form" onSubmit={handleSubmit}>
          <div className="form-grupo">
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grupo">
            <label>Apellido</label>
            <input
              type="text"
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grupo">
            <label>RUT</label>
            <input
              type="text"
              name="rut"
              value={form.rut}
              readOnly
              disabled
              className="input-bloqueado"  
              title="El RUT no se puede modificar porque es un identificador único."
            />
            <small>El RUT no se puede modificar porque es un identificador único.</small>
          </div>

          <div className="form-grupo">
            <label>Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grupo">
            <label>Profesión</label>
            <input
              type="text"
              name="profesion"
              value={form.profesion}
              onChange={handleChange}
              placeholder="Ej: Enfermero, Médico, TENS, Administrativo"
              required
            />
          </div>

          <div className="form-grupo">
            <label>Rol</label>
            <select
              name="rol"
              value={form.rol}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar rol</option>
              <option value="usuario">Usuario</option>
              <option value="admin">Admin</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

          <div className="form-grupo">
            <label>Nueva contraseña</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Dejar vacío para no cambiarla"
            />
            <small>No se muestra la contraseña actual por seguridad.</small>
          </div>

          <div className="form-grupo">
            <label htmlFor="telefono">Teléfono</label>
            <input
              type="text"
              id="telefono"
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              required
            />
          </div>

          <div className="datos-extra">
            <h3>Datos internos</h3>

            <p>
              <strong>ID:</strong> {usuario?._id || 'No disponible'}
            </p>
          </div>

          <div className="form-acciones">
            <button
              type="submit"
              className="btn-guardar"
              disabled={guardando || eliminando}
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>

            <button
              type="button"
              className="btn-eliminar"
              onClick={handleEliminar}
              disabled={guardando || eliminando}
            >
              {eliminando ? 'Eliminando...' : 'Eliminar usuario'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export default AdminUsuarioDetalle;