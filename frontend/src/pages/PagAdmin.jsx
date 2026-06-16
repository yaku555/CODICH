// importaciones 

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUsuario } from '../context/usuario.context';

import { getUsuarios } from '../api/usuarios.js';
import '../styles/AdminUsuarios.css';

function PagAdmin() {
  // los estados principales de la pagina
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const { logout } = useUsuario();
  const navigate = useNavigate();

  //el use effect
  useEffect(() => {
    const mensajeGuardado = sessionStorage.getItem('adminMensaje');

    if (mensajeGuardado) {
      setMensaje(mensajeGuardado);
      sessionStorage.removeItem('adminMensaje');
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  // carga los usuarios desde el backend
  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError('');

      const data = await getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error(error);
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  // cierra sesion y vuelve al login
  const cerrarSesion = () => {
    logout();
    navigate('/acceder', { replace: true });
  };

  const obtenerTextoArea = (areaFormacion) => {
    if (areaFormacion === 'educacion_pedagogia') {
      return 'Educación / Pedagogía';
    }

    if (areaFormacion === 'otra_area') {
      return 'Otra Área';
    }

    return 'Sin área registrada';
  };

  // filtra los usuarios 
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = `
      ${usuario.nombre || ''}
      ${usuario.apellido || ''}
      ${usuario.rut || ''}
      ${usuario.areaFormacion || ''}
      ${obtenerTextoArea(usuario.areaFormacion)}
      ${usuario.profesion || ''}
      ${usuario.rol || ''}
    `;

    return texto.toLowerCase().includes(busqueda.toLowerCase());
  });

  // mensaje simple mientras llegan los datos
  if (loading) {
    return (
      <main className="admin-page">
        <p className="admin-loading">Cargando usuarios...</p>
      </main>
    );
  }

  // la interfaz principal
  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="admin-subtitulo">Panel de administración</p>
          <h1>Usuarios registrados</h1>
        </div>

        <div className="admin-acciones">
          <span className="admin-contador">{usuarios.length} usuarios</span>

          <Link to="/admin/crear" className="btn-crear">
            Crear usuario
          </Link>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-toolbar">
          <input
            type="text"
            placeholder="Buscar por nombre, RUT, Area de Formacion, Profesion o rol..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="admin-buscador"
          />
        </div>

        {mensaje && <p className="admin-exito">{mensaje}</p>}

        {error && <p className="admin-error">{error}</p>}

        {usuariosFiltrados.length === 0 ? (
          <p className="admin-vacio">No se encontraron usuarios.</p>
        ) : (
          <div className="tabla-contenedor">
            <table className="usuarios-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>RUT</th>
                  <th>Area de Formación</th>
                  <th>Profesión</th>
                  <th>Rol</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario._id || usuario.rut}>
                    <td>
                      <strong>
                        {usuario.nombre} {usuario.apellido}
                      </strong>
                    </td>

                    <td>{usuario.rut}</td>
                    <td>{obtenerTextoArea(usuario.areaFormacion)}</td>
                    <td>{usuario.profesion || 'Sin profesión'}</td>

                    <td>
                      <span className={`rol-badge rol-${usuario.rol?.toLowerCase()}`}>
                        {usuario.rol}
                      </span>
                    </td>

                    <td>
                      <Link
                        to={`/admin/usuarios/${encodeURIComponent(usuario.rut)}`}
                        className="btn-ver"
                      >
                        Ver / Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default PagAdmin;