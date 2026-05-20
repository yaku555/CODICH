const getUsuarioData = (body) => {
  const { nombre, apellido, email, rut, rol, password } = body;
  return { nombre, apellido, email, rut, rol, password };
};


module.exports = { getUsuarioData };
