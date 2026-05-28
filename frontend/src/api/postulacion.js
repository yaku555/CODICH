import axios from './axios';

// GET todos las postulaciones
export const getPostulacionesRequest = () => 
    axios.get('/postulaciones');

// GET una postulación por RUT
export const getPostulacionByRutRequest = (rut) => 
    axios.get(`/postulaciones/${rut}`);

// POST crear postulación
export const createPostulacionRequest = (formData) => 
    axios.post('/postulaciones', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });

// PUT actualizar postulación
export const updatePostulacionRequest = (rut, formData) => 
    axios.put(`/postulaciones/${rut}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });

// DELETE eliminar postulación
export const deletePostulacionRequest = (rut) => 
    axios.delete(`/postulaciones/${rut}`);

export const getCvPostulacionRequest = (rut) =>
  axios.get(`/postulaciones/${rut}/cv`);

export const aprobarPostulacionRequest = (rut) =>
  axios.patch(`/postulaciones/${rut}/aprobar`);