
// se definen las reglas para evaluar una postulacion
const MINIMO_ANIOS_EXPERIENCIA = 2;
const MINIMO_CARACTERES_EXPERIENCIA = 30;
const EDAD_MINIMA = 18;

// reglas base que se usan para evaluar la postulacion
const textoVacio = (valor) => {
  return !valor || String(valor).trim() === '';
};

// calcula la edad del postulante usando su fecha de nacimiento
const calcularEdad = (fechaNacimiento) => {
  const nacimiento = new Date(fechaNacimiento);

  if (Number.isNaN(nacimiento.getTime())) {
    return null;
  }

  const hoy = new Date();

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad;
};

// revisa los datos de la postulacion y junta los motivos si algo no cumple
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

  // se valida que la fecha exista y que cumpla con la edad minima
  const edad = calcularEdad(datos.fechaNacimiento);

  if (edad === null) {
    motivos.push('Fecha de nacimiento no válida');
  } else if (edad < EDAD_MINIMA) {
    motivos.push('Edad insuficiente');
  }

  // se revisa que tenga informacion academica y que sea del area esperada
  if (textoVacio(datos.profesion) || textoVacio(datos.areaFormacion)) {
    motivos.push('Información académica incompleta');
  }

  if (datos.areaFormacion === 'otra_area') {
    motivos.push(
      'La formación declarada no pertenece al área de educación o pedagogía'
    );
  }

  // se valida que la experiencia tenga contenido suficiente
  if (textoVacio(datos.experiencia)) {
    motivos.push('Información laboral incompleta');
  } else if (
    String(datos.experiencia).trim().length < MINIMO_CARACTERES_EXPERIENCIA
  ) {
    motivos.push('Descripción de experiencia insuficiente');
  }

  // se revisa que los años de experiencia sean validos y cumplan el minimo
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

  // se exige que exista un documento de respaldo cargado
  if (textoVacio(datos.documentoPath)) {
    motivos.push('Falta documento de respaldo');
  }

  // si no hay motivos de rechazo, queda pre aprobada; si hay motivos, queda pre rechazada
  return {
    estado: motivos.length === 0 ? 'Pre-Aprobada' : 'Pre-Rechazada',
    motivoRechazo: motivos,
  };
};

module.exports = evaluarPostulacion;