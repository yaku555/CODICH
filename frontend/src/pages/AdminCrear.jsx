import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { crearUsuario } from '../api/usuarios.js';
import '../styles/AdminUsuarios.css';

function AdminCrear() {

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    email: '',
    profesion: '',
    rol: 'usuario',
    password: '',
  });

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  const validarFormulario = () => {
    if (
      !form.nombre.trim() ||
      !form.apellido.trim() ||
      !form.rut.trim() ||
      !form.email.trim() ||
      !form.profesion.trim() ||
      !form.rol.trim() ||
      !form.password.trim()
    ) {
      setError('Debes completar todos los campos.');
      return false;
    }

    return true;
  };

    const handleSubmit = async (e) => {
    e.preventDefault();

    setMensaje('');
    setError('');

    if (!validarFormulario()) return;

    try {
        setGuardando(true);

        const nuevoUsuario = {
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        rut: form.rut.trim(),
        email: form.email.trim().toLowerCase(),
        profesion: form.profesion.trim(),
        rol: form.rol,
        password: form.password,
        };

        await crearUsuario(nuevoUsuario);

        setMensaje('Usuario creado correctamente.');

        setForm({
        nombre: '',
        apellido: '',
        rut: '',
        email: '',
        profesion: '',
        rol: 'usuario',
        password: '',
        });
    } catch (error) {
        console.error(error);

        const mensajeServidor = error.response?.data?.error;
        setError(mensajeServidor || 'No se pudo crear el usuario.');
    } finally {
        setGuardando(false);
    }
    };

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-subtitulo">Crear usuario</p>
          <h1>Nuevo usuario</h1>
        </div>

        <Link to="/admin" className="btn-volver">
          Volver a usuarios
        </Link>
      </header>

      <section className="admin-card">
        {error && <p className="admin-error">{error}</p>}
        {mensaje && <p className="admin-exito">{mensaje}</p>}

        <form className="usuario-form" onSubmit={handleSubmit}>
          <div className="form-grupo">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grupo">
            <label htmlFor="apellido">Apellido</label>
            <input
              id="apellido"
              name="apellido"
              type="text"
              value={form.apellido}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grupo">
            <label htmlFor="rut">RUT</label>
            <input
              id="rut"
              name="rut"
              type="text"
              value={form.rut}
              onChange={handleChange}
              placeholder="Ej: 12.345.678-9"
              required
            />
          </div>

          <div className="form-grupo">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grupo">
            <label htmlFor="profesion">Profesión</label>
            <input
              id="profesion"
              name="profesion"
              type="text"
              value={form.profesion}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grupo">
            <label htmlFor="rol">Rol</label>
            <select
              id="rol"
              name="rol"
              value={form.rol}
              onChange={handleChange}
              required
            >
              <option value="usuario">Usuario</option>
              <option value="admin">Admin</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

          <div className="form-grupo">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <small>Esta contraseña será usada para iniciar sesión.</small>
          </div>

          <button type="submit" className="btn-guardar" disabled={guardando}>
            {guardando ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default AdminCrear;