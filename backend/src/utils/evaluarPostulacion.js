const MINIMO_ANIOS_EXPERIENCIA = 2;
const MINIMO_CARACTERES_EXPERIENCIA = 30;

const textoVacio = (valor) => {
  return !valor || String(valor).trim() === '';
};

const evaluarPostulacion = (datos) => {
  const motivos = [];

  if (
    textoVacio(datos.nombre) ||
    textoVacio(datos.apellido) ||
    textoVacio(datos.rut) ||
    textoVacio(datos.email) ||
    textoVacio(datos.telefono) ||
    textoVacio(datos.residencia)
  ) {
    motivos.push('Datos personales incompletos');
  }

  if (textoVacio(datos.profesion) || textoVacio(datos.areaFormacion)) {
    motivos.push('Información académica incompleta');
  }

  if (datos.areaFormacion === 'otra_area') {
    motivos.push(
      'La formación declarada no pertenece al área de educación o pedagogía'
    );
  }

  if (textoVacio(datos.experiencia)) {
    motivos.push('Información laboral incompleta');
  } else if (
    String(datos.experiencia).trim().length < MINIMO_CARACTERES_EXPERIENCIA
  ) {
    motivos.push('Descripción de experiencia insuficiente');
  }

  const aniosExperiencia = Number(datos.aniosExperiencia);

  if (
    datos.aniosExperiencia === undefined ||
    datos.aniosExperiencia === null ||
    datos.aniosExperiencia === '' ||
    Number.isNaN(aniosExperiencia)
  ) {
    motivos.push('Años de experiencia no válidos');
  } else if (aniosExperiencia < MINIMO_ANIOS_EXPERIENCIA) {
    motivos.push('Experiencia insuficiente');
  }

  if (textoVacio(datos.documentoPath)) {
    motivos.push('Falta documento de respaldo');
  }

  return {
    estado: motivos.length === 0 ? 'Pre-Aprobada' : 'Pre-Rechazada',
    motivoRechazo: motivos,
  };
};

module.exports = evaluarPostulacion;