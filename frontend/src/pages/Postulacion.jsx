import { useState } from 'react';
import { createPostulacionRequest } from '../api/postulacion';
import emailjs from "@emailjs/browser";

import '../styles/Postulacion.css';

function Postulacion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    email: '',
    telefono: '',
    profesion: '',
    experiencia: '',
    documento: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const archivoSeleccionado = e.target.files[0];

    if (archivoSeleccionado && archivoSeleccionado.type !== 'application/pdf') {
      setError('⚠️ Formato no válido. Por favor, selecciona un documento en formato PDF.');

      e.target.value = '';

      setFormData((prev) => ({
        ...prev,
        documento: null
      }));

      return;
    }

    setError('');

    setFormData((prev) => ({
      ...prev,
      documento: archivoSeleccionado
    }));
  };

  const enviarCorreoPostulacion = async () => {
    try {
      await emailjs.send(
        "service_8ry86mp",
        "template_x5it62t",
        {
          name: `${formData.nombre} ${formData.apellido}`,
          email: formData.email,
          correo: "https://www.youtube.com"
        },
        {
          publicKey: "JC5QAq6AciVrpi5gQ",
        }
      );

      console.log("Correo enviado correctamente");
    } catch (error) {
      console.error("Error al enviar correo:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!formData.nombre.trim()) return setError('El nombre es requerido');
    if (!formData.apellido.trim()) return setError('El apellido es requerido');
    if (!formData.rut.trim()) return setError('El RUT es requerido');
    if (!formData.email.trim()) return setError('El correo electrónico es requerido');
    if (!formData.telefono.trim()) return setError('El teléfono es requerido');
    if (!formData.profesion.trim()) return setError('La profesión es requerida');
    if (!formData.experiencia.trim()) return setError('La experiencia es requerida');
    if (!formData.documento) return setError('El documento CV es requerido');

    try {
      setLoading(true);

      const form = new FormData();

      form.append('nombre', formData.nombre);
      form.append('apellido', formData.apellido);
      form.append('rut', formData.rut);
      form.append('email', formData.email);
      form.append('telefono', formData.telefono);
      form.append('profesion', formData.profesion);
      form.append('experiencia', formData.experiencia);
      form.append('documento', formData.documento);

      await createPostulacionRequest(form);

      try {
        await enviarCorreoPostulacion();

        setSuccess(
          'Postulación creada correctamente. Se ha enviado un correo de confirmación.'
        );
      } catch (errorCorreo) {
        setSuccess(
          'Postulación creada correctamente, pero no se pudo enviar el correo de confirmación.'
        );
      }
      setFormData({
        nombre: '',
        apellido: '',
        rut: '',
        email: '',
        telefono: '',
        profesion: '',
        experiencia: '',
        documento: null
      });

      const fileInput = document.getElementById('documento');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      console.error(err);
      setError(
        'Error: ' +
        (err.response?.data?.error ||
          err.response?.data?.message ||
          err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="form-header-banner">
        <h1>Proceso de Postulación</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="form-postulacion-grid">
        <div className="form-column">
          <div className="form-group-custom">
            <label htmlFor="nombre">Nombres</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group-custom">
            <label htmlFor="rut">RUT</label>
            <input
              type="text"
              id="rut"
              name="rut"
              placeholder="Ej: 11111111-0"
              value={formData.rut}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group-custom">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="form-column">
          <div className="form-group-custom">
            <label htmlFor="apellido">Apellido</label>
            <input
              type="text"
              id="apellido"
              name="apellido"
              value={formData.apellido}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group-custom">
            <label htmlFor="telefono">Teléfono</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group-custom">
            <label htmlFor="profesion">Profesión</label>
            <input
              type="text"
              id="profesion"
              name="profesion"
              value={formData.profesion}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group-custom">
            <label htmlFor="experiencia">Experiencia</label>
            <input
              type="text"
              id="experiencia"
              name="experiencia"
              placeholder="Ej: 5 años"
              value={formData.experiencia}
              onChange={handleInputChange}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div
          className="form-group-custom"
          style={{ gridColumn: 'span 2', marginTop: '1rem' }}
        >
          <label htmlFor="documento">Documento CV PDF</label>
          <input
            type="file"
            id="documento"
            name="documento"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={loading}
            required
          />
        </div>

        <div className="form-actions-full">
          <button type="submit" disabled={loading} className="btn-siguiente">
            {loading ? 'Procesando...' : 'Enviar Postulación'}
          </button>
        </div>
      </form>
    </main>
  );
}

export default Postulacion; 