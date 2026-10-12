import api from './api';

export const dashboardService = {
  async getKPIs(params = {}) {
    const response = await api.get('/dashboard/kpis', { params });
    const payload = response.data?.data ?? response.data;
    return payload?.kpis ? { ...payload.kpis, ...payload } : payload;
  },
  async getDistribucionEstados(params = {}) {
    const response = await api.get('/dashboard/distribucion-estados', { params });
    return response.data?.data ?? response.data;
  },
  async getVolumenPorLinea(params = {}) {
    const response = await api.get('/dashboard/volumen-linea', { params });
    return response.data?.data ?? response.data;
  },
  async getPanelOperativo(params = {}) {
    const response = await api.get('/dashboard/panel-operativo', { params });
    return response.data?.data ?? response.data;
  },
  async exportarLotes(params = {}) {
    const response = await api.get('/dashboard/lotes-export', { params });
    return response.data?.data ?? response.data;
  },
};
