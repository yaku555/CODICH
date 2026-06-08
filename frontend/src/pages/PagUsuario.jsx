import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useUsuario } from '../context/usuario.context';
import '../styles/PagUsuario.css';

const formatearFecha = (fecha) => {
  if (!fecha) return 'No especificada';

  return new Date(fecha).toLocaleDateString('es-CL', {
    timeZone: 'UTC',
  });
};

function PagMiembros() {
  const { usuario, loading, logout } = useUsuario();
  const navigate = useNavigate();

  const cerrarSesion = () => {
    logout();
    navigate('/acceder', { replace: true });
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

  const nombreCompleto = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
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
            <span>Residencia</span>
            <strong>{usuario.residencia || 'No especificada'}</strong>
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
            <span>Rol en la plataforma</span>
            <strong>{usuario.rol || 'No especificado'}</strong>
          </div>
        </div>
      </section>
    </main>
  );
}

export default PagMiembros;