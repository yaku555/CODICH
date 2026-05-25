// frontend/src/pages/AdminUsuarioDetalle.jsx

import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import {
  getUsuarioPorRut,
  actualizarUsuario
} from '../api/usuarios.js';
import '../styles/AdminUsuarios.css';

function AdminUsuarioDetalle() {
  const { rut } = useParams();

  const [usuario, setUsuario] = useState(null);
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    email: '',
    rol: '',
    password: ''
  });

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
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
        rol: usuarioEncontrado.rol || '',
        password: ''
      });
    } catch (error) {
      console.error(error);
      setError('No se pudo cargar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'rut') return;

    setForm({
      ...form,
      [name]: value
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
        rol: form.rol
      };

      if (form.password.trim() !== '') {
        datosActualizados.password = form.password;
      }
      const usuarioActualizado = await actualizarUsuario(form.rut, datosActualizados);
      setUsuario(usuarioActualizado);

      setForm({
        nombre: usuarioActualizado.nombre || '',
        apellido: usuarioActualizado.apellido || '',
        rut: usuarioActualizado.rut || '',
        email: usuarioActualizado.email || '',
        rol: usuarioActualizado.rol || '',
        password: ''
      });

      setMensaje('Usuario actualizado correctamente.');
    } catch (error) {
      console.error(error);
      setError('No se pudo actualizar el usuario.');
    } finally {
      setGuardando(false);
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
              disabled
              className="input-bloqueado"
            />
            <small>El RUT no se puede modificar.</small>
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

          <div className="datos-extra">
            <h3>Datos internos</h3>

            <p>
              <strong>ID:</strong> {usuario?._id || 'No disponible'}
            </p>
          </div>

          <button
            type="submit"
            className="btn-guardar"
            disabled={guardando}
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AdminUsuarioDetalle;