import { useState } from 'react';
import { createPostulacionRequest } from '../api/postulacion';
import '../styles/Postulacion.css';

function Postulacion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    email: '',
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
      
      // Limpiamos el input visualmente y reseteamos el estado del documento
      e.target.value = ""; 
      setFormData(prev => ({
        ...prev,
        documento: null
      }));
      return;
    }

    // Si el archivo es correcto, limpiamos errores previos y guardamos el archivo
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

    // Validaciones de texto vacíos
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!formData.rut.trim()) {
      setError('El RUT es requerido');
      return;
    }
    if (!formData.email.trim()) {
      setError('El email es requerido');
      return;
    }
    if (!formData.documento) {
      setError('El documento es requerido');
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append('nombre', formData.nombre);
      form.append('rut', formData.rut);
      form.append('email', formData.email);
      form.append('documento', formData.documento);

      await createPostulacionRequest(form);
      setSuccess('Postulación creada correctamente');

      // Limpiar formulario tras el éxito
      setFormData({ nombre: '', rut: '', email: '', documento: null });
    } catch (err) {
      setError('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <h1>Postulación</h1>

      {/* Mensajes */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="form-postulacion">
        <h2>Nueva Postulación</h2>

        <div className="form-group">
          <label htmlFor="nombre">Nombre *</label>
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

        <div className="form-group">
          <label htmlFor="rut">RUT *</label>
          <input
            type="text"
            id="rut"
            name="rut"
            value={formData.rut}
            onChange={handleInputChange}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="type"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="documento">Documento *</label>
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

        <div className="form-actions">
          <button type="submit" disabled={loading} className="primary-btn">
            {loading ? 'Procesando...' : 'Crear'}
          </button>
        </div>
      </form>
    </main>
  );
}

export default Postulacion;