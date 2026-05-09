import {apiClient} from './client';
import {OrdemProducao, OPStatus, PedidoAssistencia, RegistoProgresso} from '../types';

export const ordersApi = {
  async getAll(params: {status?: OPStatus; search?: string} = {}): Promise<OrdemProducao[]> {
    const response = await apiClient.get('/ordens-producao', {params});
    return response.data.data;
  },

  async getById(id: number): Promise<OrdemProducao> {
    const response = await apiClient.get(`/ordens-producao/${id}`);
    return response.data.data;
  },

  async create(data: Partial<OrdemProducao>): Promise<OrdemProducao> {
    const response = await apiClient.post('/ordens-producao', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<OrdemProducao>): Promise<OrdemProducao> {
    const response = await apiClient.put(`/ordens-producao/${id}`, data);
    return response.data.data;
  },

  async updateStatus(id: number, status: OPStatus): Promise<OrdemProducao> {
    const response = await apiClient.patch(`/ordens-producao/${id}/status`, {status});
    return response.data.data;
  },

  async updateProgress(id: number, progresso: number, descricao: string): Promise<OrdemProducao> {
    const response = await apiClient.post(`/ordens-producao/${id}/progresso`, {
      progresso,
      descricao,
    });
    return response.data.data;
  },

  async getProgressHistory(id: number): Promise<RegistoProgresso[]> {
    const response = await apiClient.get(`/ordens-producao/${id}/progresso`);
    return response.data.data;
  },

  // Pedidos de Assistência
  async getPedidosAssistencia(ordemId?: number): Promise<PedidoAssistencia[]> {
    const params = ordemId ? {ordemId} : {};
    const response = await apiClient.get('/pedidos-assistencia', {params});
    return response.data.data;
  },

  async createPedidoAssistencia(data: Partial<PedidoAssistencia>): Promise<PedidoAssistencia> {
    const response = await apiClient.post('/pedidos-assistencia', data);
    return response.data.data;
  },

  async responderAssistencia(
    id: number,
    resposta: string,
    status: string,
  ): Promise<PedidoAssistencia> {
    const response = await apiClient.patch(`/pedidos-assistencia/${id}`, {resposta, status});
    return response.data.data;
  },
};
