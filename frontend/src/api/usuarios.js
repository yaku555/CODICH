import axios from './axios';

// Crear / registrar un nuevo usuario
export const crearUsuario = async (nuevoUsuario) => {
  try {
    const response = await axios.post('/usuarios', nuevoUsuario);
    return response.data;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    console.error('Respuesta del servidor:', error.response?.data);
    throw error;
  }
};

// Obtener todos los usuarios
export const getUsuarios = async () => {
  try {
    const response = await axios.get('/usuarios');
    return response.data;
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    throw error;
  }
};

// Obtener un usuario por RUT
export const getUsuarioPorRut = async (rut) => {
  try {
    const response = await axios.get(`/usuarios/${encodeURIComponent(rut)}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    throw error;
  }
};

// Actualizar un usuario por RUT
export const actualizarUsuario = async (rut, usuarioActualizado) => {
  try {
    const response = await axios.put(
      `/usuarios/${encodeURIComponent(rut)}`,
      usuarioActualizado
    );

    return response.data;
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    console.error('Respuesta del servidor:', error.response?.data);
    throw error;
  }
};

// Eliminar un usuario por RUT
export const borrarUsuario = async (rut) => {
  try {
    const response = await axios.delete(
      `/usuarios/${encodeURIComponent(rut)}`
    );

    return response.data;
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    throw error;
  }
};

// Iniciar sesión
export const loginUsuario = async (email, password) => {
  try {
    const response = await axios.post('/usuarios/login', {
      email,
      password,
    });

    return response.data;
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    console.error('Respuesta del servidor:', error.response?.data);
    throw error;
  }
};