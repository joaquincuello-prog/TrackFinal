import api from './api';

export const authService = {
  /**
   * Autenticación de usuario
   * @param {string} email
   * @param {string} password
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Obtener perfil del usuario autenticado
   */
  async getPerfil() {
    const response = await api.get('/auth/perfil');
    return response.data;
  },
};
