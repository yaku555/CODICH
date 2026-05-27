// frontend/src/pages/PagAdminPostulaciones.jsx

import React, { useEffect, useState } from 'react';
import {
  getPostulacionesRequest,
  updatePostulacionRequest,
} from '../api/postulacion.js';
import '../styles/AdminUsuarios.css';

function PagAdminPostulaciones() {
  const [postulaciones, setPostulaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarPostulaciones();
  }, []);

  const cargarPostulaciones = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await getPostulacionesRequest();
      setPostulaciones(res.data);
    } catch (error) {
      console.error(error);
      setError('No se pudieron cargar las postulaciones.');
    } finally {
      setLoading(false);
    }
  };

  const aprobarPostulacion = async (postulacion) => {
    try {
      setMensaje('');
      setError('');

      const formData = new FormData();

      formData.append('nombreCompleto', postulacion.nombreCompleto);
      formData.append('rut', postulacion.rut);
      formData.append('email', postulacion.email);
      formData.append('telefono', postulacion.telefono);
      formData.append('profesion', postulacion.profesion);
      formData.append('experiencia', postulacion.experiencia);
      formData.append('estado', 'Aprobada');

      await updatePostulacionRequest(postulacion.rut, formData);

      setMensaje('Postulación aprobada correctamente.');
      cargarPostulaciones();
    } catch (error) {
      console.error(error);
      setError('No se pudo aprobar la postulación.');
    }
  };

  const verCV = (documentoPath) => {
    if (!documentoPath) {
      alert('Esta postulación no tiene CV cargado.');
      return;
    }

    const url = `http://localhost:5000/${documentoPath}`;
    window.open(url, '_blank');
  };

  const postulacionesFiltradas = postulaciones.filter((postulacion) => {
    const texto = `
      ${postulacion.nombreCompleto}
      ${postulacion.rut}
      ${postulacion.email}
      ${postulacion.telefono}
      ${postulacion.profesion}
      ${postulacion.experiencia}
      ${postulacion.estado}
    `;

    return texto.toLowerCase().includes(busqueda.toLowerCase());
  });

  if (loading) {
    return (
      <main className="admin-page">
        <p className="admin-loading">Cargando postulaciones...</p>
      </main>
    );
  }

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
            placeholder="Buscar por nombre, RUT, email, profesión o estado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="admin-buscador"
          />
        </div>

        {mensaje && <p className="admin-exito">{mensaje}</p>}
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
                  <th>Teléfono</th>
                  <th>Profesión</th>
                  <th>Experiencia</th>
                  <th>Estado</th>
                  <th>CV</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {postulacionesFiltradas.map((postulacion) => (
                  <tr key={postulacion._id || postulacion.rut}>
                    <td>
                      <strong>{postulacion.nombreCompleto}</strong>
                    </td>

                    <td>{postulacion.rut}</td>
                    <td>{postulacion.email}</td>
                    <td>{postulacion.telefono}</td>
                    <td>{postulacion.profesion}</td>
                    <td>{postulacion.experiencia}</td>

                    <td>
                      <span className={`rol-badge rol-${postulacion.estado?.toLowerCase().replaceAll(' ', '-')}`}>
                        {postulacion.estado}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn-ver"
                        onClick={() => verCV(postulacion.documentoPath)}
                      >
                        Ver CV
                      </button>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn-guardar"
                        onClick={() => aprobarPostulacion(postulacion)}
                        disabled={postulacion.estado === 'Aprobada'}
                      >
                        {postulacion.estado === 'Aprobada'
                          ? 'Aprobada'
                          : 'Aprobar'}
                      </button>
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