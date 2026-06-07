import React, { useEffect, useState } from 'react';

import {
  getPostulacionesRequest,
  getCvPostulacionRequest,
  aprobarPostulacionRequest,
  rechazarPostulacionRequest,
} from '../api/postulacion.js';

import '../styles/AdminUsuarios.css';

function PagAdminPostulaciones() {
  const [postulaciones, setPostulaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [aprobandoRut, setAprobandoRut] = useState(null);
  const [rechazandoRut, setRechazandoRut] = useState(null);

  useEffect(() => {
    cargarPostulaciones();
  }, []);

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

  const aprobarPostulacion = async (postulacion) => {
    try {
      setMensaje('');
      setError('');
      setAprobandoRut(postulacion.rut);

      if (postulacion.estado === 'Aprobada') {
        setError('Esta postulación ya fue aprobada.');
        return;
      }

      if (postulacion.estado === 'Rechazada') {
        setError('No se puede aprobar una postulación ya rechazada.');
        return;
      }

      if (
        postulacion.estado !== 'Pre-Aprobada' &&
        postulacion.estado !== 'Pre-Rechazada'
      ) {
        setError('Solo se pueden aprobar postulaciones pre-evaluadas.');
        return;
      }

      const res = await aprobarPostulacionRequest(postulacion.rut);

      setMensaje(
        res.data?.message || 'Postulación aprobada correctamente.'
      );

      await cargarPostulaciones();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'No se pudo aprobar la postulación.'
      );
    } finally {
      setAprobandoRut(null);
    }
  };

  const rechazarPostulacion = async (postulacion) => {
    try {
      setMensaje('');
      setError('');
      setRechazandoRut(postulacion.rut);

      if (postulacion.estado === 'Rechazada') {
        setError('Esta postulación ya fue rechazada.');
        return;
      }

      if (postulacion.estado === 'Aprobada') {
        setError('No se puede rechazar una postulación ya aprobada.');
        return;
      }

      if (
        postulacion.estado !== 'Pre-Aprobada' &&
        postulacion.estado !== 'Pre-Rechazada'
      ) {
        setError('Solo se pueden rechazar postulaciones pre-evaluadas.');
        return;
      }

      const confirmar = window.confirm(
        `¿Seguro que deseas rechazar la postulación de ${postulacion.nombre} ${postulacion.apellido}?`
      );

      if (!confirmar) return;

      const comentarioAdmin = window.prompt(
        'Ingrese un comentario para el rechazo:',
        'Postulación rechazada por el administrador.'
      );

      if (comentarioAdmin === null) return;

      const res = await rechazarPostulacionRequest(
        postulacion.rut,
        comentarioAdmin.trim() || 'Postulación rechazada por el administrador.'
      );

      setMensaje(
        res.data?.message || 'Postulación rechazada correctamente.'
      );

      await cargarPostulaciones();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'No se pudo rechazar la postulación.'
      );
    } finally {
      setRechazandoRut(null);
    }
  };

  const verCV = async (rut) => {
    const ventanaCV = window.open('', '_blank');

    try {
      const { data } = await getCvPostulacionRequest(rut);

      if (!data.url) {
        throw new Error('No se recibió la URL del CV');
      }

      ventanaCV.location.href = data.url;
    } catch (error) {
      console.error(error);

      if (ventanaCV) {
        ventanaCV.close();
      }

      setError('No se pudo abrir el CV.');
    }
  };

  const obtenerTextoArea = (areaFormacion) => {
    if (areaFormacion === 'educacion_pedagogia') {
      return 'Educación / Pedagogía';
    }

    if (areaFormacion === 'otra_area') {
      return 'Otra área';
    }

    return 'No registrada';
  };

  const obtenerMotivos = (motivos) => {
    if (!motivos || motivos.length === 0) {
      return '';
    }

    return motivos.join(', ');
  };

  const obtenerClaseEstado = (estado = '') => {
    return estado
      .toLowerCase()
      .replaceAll(' ', '-');
  };

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
      ${postulacion.experiencia || ''}
      ${postulacion.aniosExperiencia || ''}
      ${postulacion.estado || ''}
      ${postulacion.motivoRechazo?.join(' ') || ''}
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
            placeholder="Buscar por nombre, RUT, email, profesión, estado o motivo..."
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
                {postulacionesFiltradas.map((postulacion) => {
                  const puedeAccionar =
                    postulacion.estado === 'Pre-Aprobada' ||
                    postulacion.estado === 'Pre-Rechazada';

                  const motivos = obtenerMotivos(postulacion.motivoRechazo);

                  return (
                    <tr key={postulacion._id || postulacion.rut}>
                      <td>
                        <strong className="nombre-postulante">
                          <span>{postulacion.nombre}</span>
                          <span>{postulacion.apellido}</span>
                        </strong>

                        {postulacion.residencia && (
                          <span className="dato-secundario">
                            {postulacion.residencia}
                          </span>
                        )}
                      </td>

                      <td>{postulacion.rut}</td>
                      <td>{postulacion.email}</td>
                      <td>{postulacion.telefono}</td>

                      <td>
                        <span>{postulacion.profesion}</span>
                        <span className="dato-secundario">
                          {obtenerTextoArea(postulacion.areaFormacion)}
                        </span>
                      </td>

                      <td>
                        <span>{postulacion.experiencia}</span>
                        <span className="dato-secundario">
                          Años exp: {postulacion.aniosExperiencia ?? 'No registrado'}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`rol-badge rol-${obtenerClaseEstado(
                            postulacion.estado
                          )}`}
                        >
                          {postulacion.estado}
                        </span>

                        {motivos && (
                          <span className="motivo-rechazo">
                            {motivos}
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn-ver"
                          onClick={() => verCV(postulacion.rut)}
                        >
                          Ver CV
                        </button>
                      </td>

                      <td>
                        <div className="acciones-postulacion">
                          <button
                            type="button"
                            className="btn-guardar"
                            onClick={() => aprobarPostulacion(postulacion)}
                            disabled={
                              !puedeAccionar ||
                              aprobandoRut === postulacion.rut
                            }
                          >
                            {aprobandoRut === postulacion.rut
                              ? 'Aprobando...'
                              : postulacion.estado === 'Aprobada'
                                ? 'Aprobada'
                                : 'Aprobar'}
                          </button>

                          <button
                            type="button"
                            className="btn-eliminar"
                            onClick={() => rechazarPostulacion(postulacion)}
                            disabled={
                              !puedeAccionar ||
                              rechazandoRut === postulacion.rut
                            }
                          >
                            {rechazandoRut === postulacion.rut
                              ? 'Rechazando...'
                              : postulacion.estado === 'Rechazada'
                                ? 'Rechazada'
                                : 'Rechazar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default PagAdminPostulaciones;