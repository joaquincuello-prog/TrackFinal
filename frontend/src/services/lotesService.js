import api from './api';

export const lotesService = {
  /**
   * Obtener listado de lotes PT con filtros opcionales
   * @param {Object} params - { estado, busqueda }
   */
  async getLotes(params = {}) {
    const response = await api.get('/lotes-pt', { params });
    return response.data;
  },

  /**
   * Obtener detalle de un lote por su código único
   * @param {string} codigo
   */
  async getLoteByCodigo(codigo) {
    const response = await api.get(`/lotes-pt/${codigo}`);
    return response.data;
  },

  /**
   * Generar atómicamente un nuevo lote PT con payload QR (Punto 3 - Envasado)
   * @param {Object} data
   */
  async crearLotePT(data) {
    const response = await api.post('/lotes-pt', data);
    return response.data;
  },

  /**
   * Modificar estado del lote (Aprobación, Cuarentena, Bloqueo, Rechazo)
   * @param {string} codigo
   * @param {string} estado
   * @param {string} motivo
   */
  async cambiarEstado(codigo, estado, motivo = '') {
    const response = await api.patch(`/lotes-pt/${codigo}/estado`, {
      estado,
      motivo,
    });
    return response.data;
  },
};
