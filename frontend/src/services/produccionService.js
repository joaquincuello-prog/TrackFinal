import api from './api';

export const produccionService = {
  /**
   * Obtener órdenes de producción activas
   */
  async getOrdenes() {
    const response = await api.get('/produccion/ordenes');
    return response.data;
  },

  /**
   * Obtener detalle de una orden de producción específica
   * @param {number} id
   */
  async getOrdenById(id) {
    const response = await api.get(`/produccion/ordenes/${id}`);
    return response.data;
  },

  /**
   * Obtener catálogo de productos terminados
   */
  async getProductos() {
    const response = await api.get('/productos');
    return response.data;
  },

  /**
   * Obtener catálogo de materias primas
   */
  async getMateriasPrimas() {
    const response = await api.get('/materias-primas');
    return response.data;
  },
};
