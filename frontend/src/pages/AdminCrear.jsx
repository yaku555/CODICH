import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { crearUsuario } from '../api/usuarios.js';
import '../styles/AdminUsuarios.css';

function AdminCrear() {
  // aqui se guarda todo lo que se escribe en el formulario
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    fechaNacimiento: '',
    email: '',
    telefono: '',
    residencia: '',
    areaFormacion: '',
    profesion: '',
    rol: 'usuario',
    password: '',
  });

  // esto ayuda a saber si se esta guardando, si salio bien o si hubo error
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // deja el rut con guion mientras se va escribiendo
  const formatearRut = (valor) => {
    const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);

    if (limpio.length <= 1) return limpio;

    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);

    return `${cuerpo}-${dv}`;
  };

  const validarFormatoRut = (rut) => {
    return /^\d{7,8}-[0-9K]$/.test(rut);
  };

  const validarTelefono = (telefono) => {
    return /^\d{9}$/.test(telefono);
  };

  const handleRutChange = (e) => {
    const rutFormateado = formatearRut(e.target.value);

    setForm((prev) => ({
      ...prev,
      rut: rutFormateado,
    }));
  };

  // esto actualiza cualquier campo normal del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    let nuevoValor = value;

    // telefono: solo números y máximo 9 dígitos
    if (name === 'telefono') {
      nuevoValor = value.replace(/\D/g, '').slice(0, 9);
    }

    // residencia y profesion: no permite números
    if (name === 'residencia' || name === 'profesion') {
      nuevoValor = value.replace(/[0-9]/g, '');
    }

    setForm((prev) => ({
      ...prev,
      [name]: nuevoValor,
    }));
  };

  // antes de guardar, se revisa que no falte nada importante
  const validarFormulario = () => {
    if (
      !form.nombre.trim() ||
      !form.apellido.trim() ||
      !form.rut.trim() ||
      !form.fechaNacimiento.trim() ||
      !form.email.trim() ||
      !form.telefono.trim() ||
      !form.residencia.trim() ||
      !form.areaFormacion.trim() ||
      !form.profesion.trim() ||
      !form.rol.trim() ||
      !form.password.trim()
    ) {
      setError('Debes completar todos los campos.');
      return false;
    }

    if (!validarFormatoRut(form.rut)) {
      setError('El RUT debe tener el formato 12345678-5, sin puntos y con guion.');
      return false;
    }

    if (!validarTelefono(form.telefono)) {
      setError('El teléfono debe contener exactamente 9 dígitos numéricos.');
      return false;
    }

    if (/[0-9]/.test(form.residencia)) {
      setError('La residencia no puede contener números.');
      return false;
    }

    if (/[0-9]/.test(form.profesion)) {
      setError('La profesión no puede contener números.');
      return false;
    }

    return true;
  };

  // cuando se envia el formulario, se manda el usuario nuevo al backend
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
        fechaNacimiento: form.fechaNacimiento.trim(),
        email: form.email.trim().toLowerCase(),
        telefono: form.telefono.trim(),
        residencia: form.residencia.trim(),
        areaFormacion: form.areaFormacion.trim(),
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
        fechaNacimiento: '',
        email: '',
        telefono: '',
        residencia: '',
        areaFormacion: '',
        profesion: '',
        rol: 'usuario',
        password: '',
      });
    } catch (error) {
      console.error(error);

      const mensajeServidor =
        error.response?.data?.error ||
        error.response?.data?.message;

      setError(mensajeServidor || 'No se pudo crear el usuario.');
    } finally {
      setGuardando(false);
    }
  };

  // la interfaz
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
              onChange={handleRutChange}
              placeholder="Ej: 12345678-9"
              maxLength="10"
              required
            />
            <small>Ingresa el RUT sin puntos y con guion.</small>
          </div>

          <div className="form-grupo">
            <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
            <input
              id="fechaNacimiento"
              name="fechaNacimiento"
              type="date"
              value={form.fechaNacimiento}
              onChange={handleChange}
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
            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono"
              name="telefono"
              type="text"
              value={form.telefono}
              onChange={handleChange}
              inputMode="numeric"
              maxLength="9"
              placeholder="Ej: 912345678"
              required
            />
          </div>

          <div className="form-grupo">
            <label htmlFor="residencia">Residencia</label>
            <input
              id="residencia"
              name="residencia"
              type="text"
              value={form.residencia}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-grupo">
            <label htmlFor="areaFormacion">Área de formación</label>
            <select
              id="areaFormacion"
              name="areaFormacion"
              value={form.areaFormacion}
              onChange={handleChange}
              required
            >
              <option value="">Selecciona un área</option>
              <option value="educacion_pedagogia">Educación/Pedagogía</option>
              <option value="otra_area">Otra Área</option>
            </select>
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