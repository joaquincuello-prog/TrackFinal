import axios from 'axios';

// Obtener la URL base adecuada según el origen de conexión (localhost o IP de red móvil)
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    const { hostname } = window.location;
    // Si se accede desde celular / tablet u otra PC en la LAN
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // Aprovechar el proxy de Vite en el mismo puerto abierto (5173)
      return '/api/v1';
    }
  }
  return import.meta.env.VITE_API_URL || '/api/v1';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor de Petición: adjuntar token Bearer
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('trackfinal_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Respuesta: capturar token expirado (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Sesión expirada o no autorizada
      localStorage.removeItem('trackfinal_token');
      localStorage.removeItem('trackfinal_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
