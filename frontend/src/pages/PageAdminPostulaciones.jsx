import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPostulacionesRequest } from '../api/postulacion.js';
import '../styles/AdminUsuarios.css';

function PagAdminPostulaciones() {

  // estados principales para la lista, buscador, carga y errores
  const [postulaciones, setPostulaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarPostulaciones();
  }, []);

  // carga las postulaciones desde el backend con el get
  const cargarPostulaciones = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getPostulacionesRequest();
      setPostulaciones(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
      setError('No se pudieron cargar las postulaciones.');
    } finally {
      setLoading(false);
    }
  };

  // prepara el area de formacion para mostrarla de forma correcta
  const obtenerTextoArea = (areaFormacion) => {
    if (areaFormacion === 'educacion_pedagogia') {
      return 'Educación / Pedagogía';
    }

    if (areaFormacion === 'otra_area') {
      return 'Otra área';
    }

    return 'No registrada';
  };

  const obtenerClaseEstado = (estado = '') => {
    return estado
      .toLowerCase()
      .replaceAll(' ', '-');
  };

  // filtra las postulaciones segun lo ingresado    
  const postulacionesFiltradas = postulaciones.filter((postulacion) => {
    const texto = `
      ${postulacion.nombre || ''}
      ${postulacion.apellido || ''}
      ${postulacion.rut || ''}
      ${postulacion.email || ''}
      ${postulacion.telefono || ''}
      ${postulacion.residencia || ''}
      ${postulacion.profesion || ''}
      ${postulacion.areaFormacion || ''}
      ${obtenerTextoArea(postulacion.areaFormacion)}
      ${postulacion.estado || ''}
      ${postulacion.motivoRechazo?.join(' ') || ''}
    `;

    return texto.toLowerCase().includes(busqueda.toLowerCase());
  });

  // un mensaje simple mientras llegan los datos
  if (loading) {
    return (
      <main className="admin-page">
        <p className="admin-loading">Cargando postulaciones...</p>
      </main>
    );
  }

  // la interfaz
  return (
    <main className="admin-page admin-page-postulaciones">
      <section className="admin-header">
        <div>
          <p className="admin-subtitulo">Panel de administración</p>
          <h1>Postulaciones recibidas</h1>
        </div>

        <div className="admin-acciones">
          <span className="admin-contador">
            {postulaciones.length} postulaciones
          </span>
        </div>
      </section>

      <section className="admin-card admin-card-postulaciones">
        <div className="admin-toolbar">
          <input
            type="text"
            placeholder="Buscar por nombre, RUT, email, profesión, estado o motivo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="admin-buscador"
          />
        </div>

        {error && <p className="admin-error">{error}</p>}

        {postulacionesFiltradas.length === 0 ? (
          <p className="admin-vacio">No se encontraron postulaciones.</p>
        ) : (
          <div className="tabla-contenedor">
            <table className="usuarios-tabla postulaciones-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>RUT</th>
                  <th>Email</th>
                  <th>Profesión</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {postulacionesFiltradas.map((postulacion) => (
                  <tr key={postulacion._id || postulacion.rut}>
                    <td>
                      <strong>
                        {postulacion.nombre} {postulacion.apellido}
                      </strong>
                    </td>

                    <td>{postulacion.rut}</td>

                    <td>{postulacion.email}</td>

                    <td>{postulacion.profesion || 'No registrada'}</td>

                    <td>
                      <span
                        className={`rol-badge rol-${obtenerClaseEstado(
                          postulacion.estado
                        )}`}
                      >
                        {postulacion.estado || 'Sin estado'}
                      </span>
                    </td>

                    <td>
                      <Link
                        to={`/admin/postulaciones/${encodeURIComponent(
                          postulacion.rut
                        )}`}
                        className="btn-ver"
                      >
                        Ver detalle
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

export default PagAdminPostulaciones;