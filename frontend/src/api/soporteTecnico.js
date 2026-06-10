import axios from './axios';

export const loginSoporteTecnico = async (email, password) => {
  try {
    const response = await axios.post('/soporte-tecnico/login', {
      email,
      password,
    });

    return response.data;
  } catch (error) {
    console.error('Error al iniciar sesión como soporte técnico:', error);
    console.error('Respuesta del servidor:', error.response?.data);
    throw error;
  }
};