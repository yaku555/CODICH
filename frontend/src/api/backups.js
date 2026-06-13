import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const getBackupsRequest = () => {
  return axios.get(`${API_URL}/backups`);
};

export const crearBackupRequest = () => {
  return axios.post(`${API_URL}/backups/crear`);
};

export const restaurarBackupRequest = (id) => {
  return axios.post(`${API_URL}/backups/${id}/restaurar`, {
    confirmacion: "CONFIRMO_RESTAURAR",
  });
};