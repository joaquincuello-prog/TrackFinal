import api from './api';

// La API responde con la envoltura { success, data }. Se extrae el contenido útil.
const unwrap = (response) => {
  const body = response?.data;
  return body && typeof body === 'object' && 'data' in body ? body.data : body;
};

export const trazabilidadService = {
  /**
   * Obtener árbol genealógico hacia atrás (Backward Traceability) de un Lote PT
   * @param {string} codigoLotePT
   */
  async getGenealogiaAtras(codigoLotePT) {
    const response = await api.get(`/trazabilidad/backward/${encodeURIComponent(codigoLotePT)}`);
    return unwrap(response);
  },

  /**
   * Obtener árbol hacia adelante (Forward Traceability) desde un Lote MP o Lote PT
   * @param {string} codigoLote
   */
  async getGenealogiaAdelante(codigoLote) {
    const response = await api.get(`/trazabilidad/forward/${encodeURIComponent(codigoLote)}`);
    return unwrap(response);
  },

  /**
   * Bloqueo Preventivo Cautelar masivo de lotes PT afectados por una MP desviada
   * @param {string} codigoLoteMP
   * @param {string} motivo
   */
  async bloqueoPreventivoRecall(codigoLoteMP, motivo) {
    const response = await api.post('/trazabilidad/recall/bloqueo-preventivo', {
      codigo_lote_mp: codigoLoteMP,
      motivo,
    });
    return unwrap(response);
  },

  /**
   * Obtener DataURL oficial del Código QR generado por el backend
   * @param {string} codigoLotePT
   */
  async getQR(codigoLotePT) {
    const response = await api.get(`/lotes-pt/${codigoLotePT}/qr`);
    return response.data;
  },
};

export default trazabilidadService;
