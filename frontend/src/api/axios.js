import axios from "axios";

// Base URL del backend
const instance = axios.create({
  baseURL: 'http://localhost:6767/api', 
});

export default instance;

