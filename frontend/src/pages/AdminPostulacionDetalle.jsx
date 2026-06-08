import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  getPostulacionByRutRequest,
  getCvPostulacionRequest,
  aprobarPostulacionRequest,
  rechazarPostulacionRequest,
} from '../api/postulacion.js';

import '../styles/AdminUsuarios.css';
import '../styles/AdminPostulacionDetalle.css';

function AdminPostulacionDetalle() {
  const { rut } = useParams();

  const [postulacion, setPostulacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [errorAccion, setErrorAccion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [aprobando, setAprobando] = useState(false);
  const [rechazando, setRechazando] = useState(false);

  useEffect(() => {
    cargarPostulacion();
  }, [rut]);

  const cargarPostulacion = async () => {
    try {
      setLoading(true);
      setErrorCarga('');

      const { data } = await getPostulacionByRutRequest(rut);
      setPostulacion(data);
    } catch (error) {
      console.error(error);
      setErrorCarga('No se pudo cargar el detalle de la postulación.');
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No registrada';

    const fechaConvertida = new Date(fecha);

    if (Number.isNaN(fechaConvertida.getTime())) {
      return 'No registrada';
    }

    return fechaConvertida.toLocaleDateString('es-CL', {
      timeZone: 'UTC',
    });
  };

  const obtenerTextoArea = (areaFormacion) => {
    if (areaFormacion === 'educacion_pedagogia') {
      return 'Educación / Pedagogía';
    }

    if (areaFormacion === 'otra_area') {
      return 'Otra Área';
    }

    return 'No registrada';
  };

  const obtenerMotivos = (motivos) => {
    if (!motivos || motivos.length === 0) {
      return 'Sin observaciones';
    }

    return motivos.join(', ');
  };

  const verCV = async () => {
    const ventanaCV = window.open('', '_blank');

    try {
      setMensaje('');
      setErrorAccion('');

      const { data } = await getCvPostulacionRequest(postulacion.rut);

      if (!data.url) {
        throw new Error('No se recibió la URL del CV');
      }

      ventanaCV.location.href = data.url;
    } catch (error) {
      console.error(error);

      if (ventanaCV) {
        ventanaCV.close();
      }

      setErrorAccion('No se pudo abrir el CV.');
    }
  };

  const aprobarPostulacion = async () => {
    try {
      setMensaje('');
      setErrorAccion('');
      setAprobando(true);

      if (postulacion.estado === 'Aprobada') {
        setErrorAccion('Esta postulación ya fue aprobada.');
        return;
      }

      if (postulacion.estado === 'Rechazada') {
        setErrorAccion('No se puede aprobar una postulación ya rechazada.');
        return;
      }

      if (
        postulacion.estado !== 'Pre-Aprobada' &&
        postulacion.estado !== 'Pre-Rechazada'
      ) {
        setErrorAccion('Solo se pueden aprobar postulaciones pre-evaluadas.');
        return;
      }

      const res = await aprobarPostulacionRequest(postulacion.rut);

      setMensaje(res.data?.message || 'Postulación aprobada correctamente.');

      await cargarPostulacion();
    } catch (error) {
      console.error(error);

      setErrorAccion(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'No se pudo aprobar la postulación.'
      );
    } finally {
      setAprobando(false);
    }
  };

  const rechazarPostulacion = async () => {
    try {
      setMensaje('');
      setErrorAccion('');
      setRechazando(true);

      if (postulacion.estado === 'Rechazada') {
        setErrorAccion('Esta postulación ya fue rechazada.');
        return;
      }

      if (postulacion.estado === 'Aprobada') {
        setErrorAccion('No se puede rechazar una postulación ya aprobada.');
        return;
      }

      if (
        postulacion.estado !== 'Pre-Aprobada' &&
        postulacion.estado !== 'Pre-Rechazada'
      ) {
        setErrorAccion('Solo se pueden rechazar postulaciones pre-evaluadas.');
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

      setMensaje(res.data?.message || 'Postulación rechazada correctamente.');

      await cargarPostulacion();
    } catch (error) {
      console.error(error);

      setErrorAccion(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'No se pudo rechazar la postulación.'
      );
    } finally {
      setRechazando(false);
    }
  };

  if (loading) {
    return (
      <main className="admin-page">
        <p className="admin-loading">Cargando detalle de postulación...</p>
      </main>
    );
  }

  if (errorCarga) {
    return (
      <main className="admin-page">
        <p className="admin-error">{errorCarga}</p>

        <Link to="/admin/postulaciones" className="btn-volver">
          Volver a postulaciones
        </Link>
      </main>
    );
  }

  if (!postulacion) {
    return (
      <main className="admin-page">
        <p className="admin-vacio">No se encontró la postulación.</p>

        <Link to="/admin/postulaciones" className="btn-volver">
          Volver a postulaciones
        </Link>
      </main>
    );
  }

  const puedeAccionar =
    postulacion.estado === 'Pre-Aprobada' ||
    postulacion.estado === 'Pre-Rechazada';

  return (
    <main className="admin-page">
      <section className="admin-header">
        <div>
          <p className="admin-subtitulo">Detalle de postulación</p>
          <h1>
            {postulacion.nombre} {postulacion.apellido}
          </h1>
        </div>

        <div className="admin-acciones">
          {postulacion.documentoPath && (
            <button type="button" className="btn-ver" onClick={verCV}>
              Ver CV
            </button>
          )}

          <button
            type="button"
            className="btn-guardar"
            onClick={aprobarPostulacion}
            disabled={!puedeAccionar || aprobando}
          >
            {aprobando
              ? 'Aprobando...'
              : postulacion.estado === 'Aprobada'
                ? 'Aprobada'
                : 'Aprobar'}
          </button>

          <button
            type="button"
            className="btn-eliminar"
            onClick={rechazarPostulacion}
            disabled={!puedeAccionar || rechazando}
          >
            {rechazando
              ? 'Rechazando...'
              : postulacion.estado === 'Rechazada'
                ? 'Rechazada'
                : 'Rechazar'}
          </button>

          <Link to="/admin/postulaciones" className="btn-crear">
            Volver
          </Link>
        </div>
      </section>

      {mensaje && <p className="admin-exito">{mensaje}</p>}
      {errorAccion && <p className="admin-error">{errorAccion}</p>}

      <section className="admin-card detalle-postulacion-card">
        <div className="detalle-grid">
          <div className="detalle-item">
            <span>Nombre</span>
            <strong>
              {postulacion.nombre} {postulacion.apellido}
            </strong>
          </div>

          <div className="detalle-item">
            <span>RUT</span>
            <strong>{postulacion.rut || 'No registrado'}</strong>
          </div>

          <div className="detalle-item">
            <span>Fecha de nacimiento</span>
            <strong>{formatearFecha(postulacion.fechaNacimiento)}</strong>
          </div>

          <div className="detalle-item">
            <span>Email</span>
            <strong>{postulacion.email || 'No registrado'}</strong>
          </div>

          <div className="detalle-item">
            <span>Teléfono</span>
            <strong>{postulacion.telefono || 'No registrado'}</strong>
          </div>

          <div className="detalle-item">
            <span>Residencia</span>
            <strong>{postulacion.residencia || 'No registrada'}</strong>
          </div>

          <div className="detalle-item">
            <span>Profesión</span>
            <strong>{postulacion.profesion || 'No registrada'}</strong>
          </div>

          <div className="detalle-item">
            <span>Área de formación</span>
            <strong>{obtenerTextoArea(postulacion.areaFormacion)}</strong>
          </div>

          <div className="detalle-item">
            <span>Años de experiencia</span>
            <strong>
              {postulacion.aniosExperiencia ?? 'No registrado'}
            </strong>
          </div>

          <div className="detalle-item">
            <span>Estado</span>
            <strong>{postulacion.estado || 'No registrado'}</strong>
          </div>

          <div className="detalle-item detalle-item-full">
            <span>Experiencia</span>
            <strong>{postulacion.experiencia || 'No registrada'}</strong>
          </div>

          <div className="detalle-item detalle-item-full">
            <span>Motivo de evaluación / rechazo</span>
            <strong>{obtenerMotivos(postulacion.motivoRechazo)}</strong>
          </div>

          <div className="detalle-item detalle-item-full">
            <span>Comentario del administrador</span>
            <strong>{postulacion.comentarioAdmin || 'Sin comentario'}</strong>
          </div>

          <div className="detalle-item">
            <span>Fecha revisión admin</span>
            <strong>{formatearFecha(postulacion.fechaRevisionAdmin)}</strong>
          </div>

          <div className="detalle-item">
            <span>CV</span>
            <strong>
              {postulacion.documentoPath ? 'Adjuntado' : 'No adjuntado'}
            </strong>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminPostulacionDetalle;