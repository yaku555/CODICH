import { useState } from 'react';
import { createPostulacionRequest } from '../api/postulacion';
import '../styles/Postulacion.css';

function Postulacion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 1. Estado unificado con todos los datos de texto + el archivo CV
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    rut: '',
    email: '',
    telefono: '',
    profesion: '',
    experiencia: '',
    documento: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const archivoSeleccionado = e.target.files[0];

    // Validar si el archivo existe y si NO es un PDF
    if (archivoSeleccionado && archivoSeleccionado.type !== "application/pdf") {
      setError('⚠️ Formato no válido. Por favor, selecciona un documento en formato PDF.');
      
      e.target.value = ""; 
      setFormData(prev => ({
        ...prev,
        documento: null
      }));
      return;
    }

    setError('');
    setFormData(prev => ({
      ...prev,
      documento: archivoSeleccionado
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 2. Validaciones de todos los campos obligatorios antes de enviar
    if (!formData.nombreCompleto.trim()) return setError('El nombre completo es requerido');
    if (!formData.rut.trim()) return setError('El RUT es requerido');
    if (!formData.email.trim()) return setError('El correo electrónico es requerido');
    if (!formData.telefono.trim()) return setError('El teléfono es requerido');
    if (!formData.profesion.trim()) return setError('La profesión es requerida');
    if (!formData.experiencia.trim()) return setError('La experiencia es requerida');
    if (!formData.documento) return setError('El documento (CV) es requerido');

    try {
      setLoading(true);

      // 3. Empaquetamos todo en FormData porque incluye un archivo (el PDF)
      const form = new FormData();
      form.append('nombreCompleto', formData.nombreCompleto);
      form.append('rut', formData.rut);
      form.append('email', formData.email);
      form.append('telefono', formData.telefono);
      form.append('profesion', formData.profesion);
      form.append('experiencia', formData.experiencia);
      form.append('documento', formData.documento); // El archivo físico

      await createPostulacionRequest(form);
      setSuccess('Postulación creada correctamente con su documento');

      // Limpiar formulario tras el éxito
      setFormData({ 
        nombreCompleto: '', 
        rut: '', 
        email: '', 
        telefono: '', 
        profesion: '', 
        experiencia: '', 
        documento: null 
      });
      
      // Limpiar visualmente el input file de HTML
      const fileInput = document.getElementById('documento');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      setError('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      {/* Banner superior de pasos */}
      <div className="form-header-banner">
        <h1>Proceso de Postulación</h1>
      </div>

      {/* Mensajes de feedback */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Formulario en Malla (Grid) */}
      <form onSubmit={handleSubmit} className="form-postulacion-grid">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="form-column">
          <div className="form-group-custom">
            <label htmlFor="nombreCompleto">Nombre Completo</label>
            <input
              type="text"
              id="nombreCompleto"
              name="nombreCompleto"
              value={formData.nombreCompleto}
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

        {/* COLUMNA DERECHA */}
        <div className="form-column">
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

        {/* CAMPO ADICIONAL: Documento CV (Abarca el ancho completo abajo de las columnas) */}
        <div className="form-group-custom  " style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
          <label htmlFor="documento">Documento CV (PDF)</label>
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

        {/* Botón inferior centrado */}
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