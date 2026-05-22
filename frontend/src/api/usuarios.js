import axios from './axios';


// Crear / registrar un nuevo usuario
export const crearUsuario = (nuevoUsuario) => {
  return axios
    .post('/usuarios', nuevoUsuario)
    .then((response) => {
      console.log('Usuario   creado:', response.data);
      return response.data;
    })
    .catch((error) => {
      console.error('Error al crear usuario:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      throw error;
    });
};

// Obtener todos los usuarios
export const getUsuarios = () => {
  return axios.get('/usuarios')
    .then((response) => response.data)
    .catch((error) => {
      console.error('Error al obtener los usuarios:', error);
      throw error;
    });
};


// Función para actualizar un usuario
export const actualizarUsuario = (idUsuario, updatedUser) => {
  return axios.put(`/usuarios/${idUsuario}`, updatedUser)
    .then((response) => response.data)  // Retorna la respuesta
    .catch((error) => {
      console.error('Error al actualizar el usuario:', error);
      throw error;  
    });
};
// Función para eliminar un usuario
export const borrarUsuario = (idUsuario) => {
  return axios.delete(`/usuarios/${idUsuario}`) 
    .then((response) => response.data)
    .catch((error) => {
      console.error('Error al eliminar el usuario:', error);
      throw error;
    });
};

//login
export const loginUsuario = (email, password) => {
  return axios
    .post('/usuarios/login', { email, password })
    .then((response) => response.data)
    .catch((error) => {
      console.error('Error al iniciar sesión:', error);
      throw error;
    });
};