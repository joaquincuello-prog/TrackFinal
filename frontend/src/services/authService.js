import api from './api';

export const authService = {
  /**
   * Autenticación de usuario
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    // El backend devuelve { success, message, data: { token, usuario } }
    // Desanidamos para que AuthContext reciba { token, usuario } directamente
    return response.data.data;
  },

  /**
   * Obtener perfil del usuario autenticado
   */
  async getPerfil() {
    // El backend devuelve { success, data: { id, nombre, ... } }
    // AuthContext espera { usuario: {...} }
    const response = await api.get('/auth/me');
    return { usuario: response.data.data };
  },
};
