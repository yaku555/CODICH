import React, { useEffect, useState } from 'react';
import emailjs from "@emailjs/browser";

import {
  getPostulacionesRequest,
  updatePostulacionRequest,
  getCvPostulacionRequest,
} from '../api/postulacion.js';
import { crearUsuario } from '../api/usuarios.js';
import '../styles/AdminUsuarios.css';

function PagAdminPostulaciones() {
  const [postulaciones, setPostulaciones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [aprobandoRut, setAprobandoRut] = useState(null);

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

  const generarPasswordProvisoria = () => {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = 'Codich-';

    for (let i = 0; i < 8; i++) {
      const indice = Math.floor(Math.random() * caracteres.length);
      password += caracteres[indice];
    }

    return password;
  };

  const enviarCorreoAprobado = async (postulacion, passwordProvisoria) => {
    const nombreCompleto = `${postulacion.nombre} ${postulacion.apellido}`.trim();

    await emailjs.send(
      "service_8ry86mp",
      "template_rp7plkw",
      {
        name: nombreCompleto,
        email: postulacion.email,
        link_pago: "https://www.transbank.cl",
        password: passwordProvisoria,
        rut: postulacion.rut,
        profesion: postulacion.profesion,
      },
      {
        publicKey: "JC5QAq6AciVrpi5gQ",
      }
    );
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

      if (
        !postulacion.nombre ||
        !postulacion.apellido ||
        !postulacion.rut ||
        !postulacion.email ||
        !postulacion.telefono ||
        !postulacion.profesion
      ) {
        setError('La postulación no tiene todos los datos necesarios para crear el usuario.');
        return;
      }

      const passwordProvisoria = generarPasswordProvisoria();

      const nuevoUsuario = {
        nombre: postulacion.nombre,
        apellido: postulacion.apellido,
        rut: postulacion.rut,
        email: postulacion.email,
        telefono: postulacion.telefono,
        profesion: postulacion.profesion,
        rol: 'usuario',
        password: passwordProvisoria,
      };

      await crearUsuario(nuevoUsuario);

      const datosPostulacion = new FormData();

      datosPostulacion.append('nombre', postulacion.nombre);
      datosPostulacion.append('apellido', postulacion.apellido);
      datosPostulacion.append('rut', postulacion.rut);
      datosPostulacion.append('email', postulacion.email);
      datosPostulacion.append('telefono', postulacion.telefono);
      datosPostulacion.append('profesion', postulacion.profesion);
      datosPostulacion.append('experiencia', postulacion.experiencia);
      datosPostulacion.append('estado', 'Aprobada');

      await updatePostulacionRequest(postulacion.rut, datosPostulacion);

      try {
        await enviarCorreoAprobado(postulacion, passwordProvisoria);

        setMensaje(
          `Postulación aprobada, usuario creado y correo enviado correctamente. Contraseña provisoria: ${passwordProvisoria}`
        );
      } catch (errorCorreo) {
        console.error('Error al enviar correo de aprobación:', errorCorreo);

        setMensaje(
          `Postulación aprobada y usuario creado correctamente, pero no se pudo enviar el correo. Contraseña provisoria: ${passwordProvisoria}`
        );
      }

      await cargarPostulaciones();
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'No se pudo aprobar la postulación ni crear el usuario.'
      );
    } finally {
      setAprobandoRut(null);
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

  const postulacionesFiltradas = postulaciones.filter((postulacion) => {
    const texto = `
      ${postulacion.nombre}
      ${postulacion.apellido}
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
                      <strong className="nombre-postulante">
                        <span>{postulacion.nombre}</span>
                        <span>{postulacion.apellido}</span>
                      </strong>
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
                        onClick={() => verCV(postulacion.rut)}
                      >
                        Ver CV
                      </button>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn-guardar"
                        onClick={() => aprobarPostulacion(postulacion)}
                        disabled={postulacion.estado === 'Aprobada' || aprobandoRut === postulacion.rut}
                      >
                        {aprobandoRut === postulacion.rut
                          ? 'Aprobando...'
                          : postulacion.estado === 'Aprobada'
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