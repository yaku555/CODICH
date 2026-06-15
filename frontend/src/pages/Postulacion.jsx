import { useState } from 'react';
import { createPostulacionRequest } from '../api/postulacion';
import '../styles/Postulacion.css';

function Postulacion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const LIMITE_ARCHIVO_MB = 5;
  const LIMITE_ARCHIVO_BYTES = LIMITE_ARCHIVO_MB * 1024 * 1024;

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    fechaNacimiento: '',
    email: '',
    telefono: '',
    residencia: '',
    profesion: '',
    areaFormacion: '',
    experiencia: '',
    aniosExperiencia: '',
    documento: null,
  });

  const formatearRut = (valor) => {
    const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);

    if (limpio.length <= 1) return limpio;

    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);

    return `${cuerpo}-${dv}`;
  };

  const validarFormatoRut = (rut) => {
    return /^\d{7,8}-[0-9K]$/.test(rut);
  };

  const validarSoloLetras = (texto) => {
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(texto.trim());
  };

  const validarTelefono = (telefono) => {
    return /^\d{9}$/.test(telefono);
  };

  const handleRutChange = (e) => {
    const rutFormateado = formatearRut(e.target.value);

    setFormData((prev) => ({
      ...prev,
      rut: rutFormateado,
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let nuevoValor = value;

    // Nombre y apellido: solo letras y espacios
    if (name === 'nombre' || name === 'apellido') {
      nuevoValor = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    }

    // Teléfono: solo números y máximo 9 dígitos
    if (name === 'telefono') {
      nuevoValor = value.replace(/\D/g, '').slice(0, 9);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: nuevoValor,
    }));
  };

  const handleFileChange = (e) => {
    const archivoSeleccionado = e.target.files[0];

    setError('');

    if (!archivoSeleccionado) {
      setFormData((prev) => ({
        ...prev,
        documento: null,
      }));
      return;
    }

    if (archivoSeleccionado.type !== 'application/pdf') {
      setError('Formato no válido. Por favor, selecciona un documento en formato PDF.');
      e.target.value = '';

      setFormData((prev) => ({
        ...prev,
        documento: null,
      }));
      return;
    }

    if (archivoSeleccionado.size > LIMITE_ARCHIVO_BYTES) {
      setError(`El archivo no puede superar los ${LIMITE_ARCHIVO_MB} MB.`);
      e.target.value = '';

      setFormData((prev) => ({
        ...prev,
        documento: null,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      documento: archivoSeleccionado,
    }));
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      apellido: '',
      rut: '',
      fechaNacimiento: '',
      email: '',
      telefono: '',
      residencia: '',
      profesion: '',
      areaFormacion: '',
      experiencia: '',
      aniosExperiencia: '',
      documento: null,
    });

    const fileInput = document.getElementById('documento');
    if (fileInput) fileInput.value = '';
  };

  const validarFormulario = () => {
    if (!formData.nombre.trim()) return 'El nombre es requerido';

    if (!validarSoloLetras(formData.nombre)) {
      return 'El nombre solo puede contener letras y espacios';
    }

    if (!formData.apellido.trim()) return 'El apellido es requerido';

    if (!validarSoloLetras(formData.apellido)) {
      return 'El apellido solo puede contener letras y espacios';
    }
    if (!formData.rut.trim()) return 'El RUT es requerido';

    if (!validarFormatoRut(formData.rut)) {
      return 'El RUT debe tener el formato 12345678-5.';
    }

    if (!formData.fechaNacimiento.trim()) return 'La fecha de nacimiento es requerida';
    if (!formData.email.trim()) return 'El correo electrónico es requerido';
    if (!formData.telefono.trim()) return 'El teléfono es requerido';
    if (!validarTelefono(formData.telefono)) {
      return 'El teléfono debe contener exactamente 9 dígitos numéricos';
    }
    if (!formData.residencia.trim()) return 'El lugar de residencia es requerido';
    if (!formData.profesion.trim()) return 'La profesión es requerida';
    if (!formData.areaFormacion) return 'El área de formación es requerida';
    if (!formData.experiencia.trim()) return 'La experiencia es requerida';

    if (
      formData.aniosExperiencia === '' ||
      formData.aniosExperiencia === null ||
      Number(formData.aniosExperiencia) < 0
    ) {
      return 'Los años de experiencia deben ser válidos';
    }

    if (!formData.documento) return 'El documento CV es requerido';

    if (formData.documento.size > LIMITE_ARCHIVO_BYTES) {
      return `El archivo no puede superar los ${LIMITE_ARCHIVO_MB} MB.`;
    }

    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();

      form.append('nombre', formData.nombre);
      form.append('apellido', formData.apellido);
      form.append('rut', formData.rut);
      form.append('fechaNacimiento', formData.fechaNacimiento);
      form.append('email', formData.email);
      form.append('telefono', formData.telefono);
      form.append('residencia', formData.residencia);
      form.append('profesion', formData.profesion);
      form.append('areaFormacion', formData.areaFormacion);
      form.append('experiencia', formData.experiencia);
      form.append('aniosExperiencia', formData.aniosExperiencia);
      form.append('documento', formData.documento);

      const res = await createPostulacionRequest(form);

      setSuccess(
        res.data?.message ||
        'Postulación creada correctamente. Se ha enviado un correo de confirmación.'
      );


      limpiarFormulario();
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
    <>
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
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group-custom">
            <label htmlFor="rut">RUT</label>
            <input
              id="rut"
              name="rut"
              type="text"
              value={formData.rut}
              onChange={handleRutChange}
              placeholder="12345678-5"
              required
            />
          </div>

          <div className="form-group-custom">
            <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
            <input
              id="fechaNacimiento"
              name="fechaNacimiento"
              type="date"
              value={formData.fechaNacimiento}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group-custom">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group-custom">
            <label htmlFor="residencia">Lugar de residencia</label>
            <input
              id="residencia"
              name="residencia"
              type="text"
              value={formData.residencia}
              onChange={handleInputChange}
              placeholder="Ej: Santiago"
              required
            />
          </div>

          <div className="form-group-custom">
            <label htmlFor="areaFormacion">Área de formación</label>
            <select
              id="areaFormacion"
              name="areaFormacion"
              value={formData.areaFormacion}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccione área de formación</option>
              <option value="educacion_pedagogia">Educación / Pedagogía</option>
              <option value="otra_area">Otra área</option>
            </select>
          </div>
        </div>

        <div className="form-column">
          <div className="form-group-custom">
            <label htmlFor="apellido">Apellido</label>
            <input
              id="apellido"
              name="apellido"
              type="text"
              value={formData.apellido}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group-custom">
            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono"
              name="telefono"
              type="text"
              value={formData.telefono}
              onChange={handleInputChange}
              inputMode="numeric"
              maxLength="9"
              placeholder="Ej: 912345678"
              required
            />
          </div>

          <div className="form-group-custom">
            <label htmlFor="profesion">Profesión</label>
            <input
              id="profesion"
              name="profesion"
              type="text"
              value={formData.profesion}
              onChange={handleInputChange}
              placeholder="Ej: Profesor de Historia"
              required
            />
          </div>

          <div className="form-group-custom">
            <label htmlFor="aniosExperiencia">Años de experiencia</label>
            <input
              id="aniosExperiencia"
              name="aniosExperiencia"
              type="number"
              min="0"
              value={formData.aniosExperiencia}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group-custom">
            <label htmlFor="documento">Documento CV PDF</label>
            <input
              id="documento"
              name="documento"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              required
            />
          </div>
        </div>

        <div className="form-actions-full">
          <div className="form-group-custom" style={{ width: '100%' }}>
            <label htmlFor="experiencia">Experiencia</label>
            <textarea
              id="experiencia"
              name="experiencia"
              value={formData.experiencia}
              onChange={handleInputChange}
              placeholder="Describe tu experiencia relacionada con diseño instruccional o labores afines."
              required
            />
          </div>
        </div>

        <div className="form-actions-full">
          <button type="submit" className="btn-siguiente" disabled={loading}>
            {loading ? 'Procesando...' : 'Enviar Postulación'}
          </button>
        </div>
      </form>
    </>
  );
}

export default Postulacion;