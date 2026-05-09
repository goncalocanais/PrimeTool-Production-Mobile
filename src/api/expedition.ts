import {apiClient} from './client';
import {Expedicao} from '../types';

export const expeditionApi = {
  async getAll(status?: string): Promise<Expedicao[]> {
    const response = await apiClient.get('/expedicoes', {params: status ? {status} : {}});
    return response.data.data;
  },

  async getById(id: number): Promise<Expedicao> {
    const response = await apiClient.get(`/expedicoes/${id}`);
    return response.data.data;
  },

  async create(data: Partial<Expedicao>): Promise<Expedicao> {
    const response = await apiClient.post('/expedicoes', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<Expedicao>): Promise<Expedicao> {
    const response = await apiClient.put(`/expedicoes/${id}`, data);
    return response.data.data;
  },

  async updateStatus(id: number, status: string): Promise<Expedicao> {
    const response = await apiClient.patch(`/expedicoes/${id}/status`, {status});
    return response.data.data;
  },

  async registarEnvio(
    id: number,
    transportadora: string,
    guiaTransporte: string,
  ): Promise<Expedicao> {
    const response = await apiClient.patch(`/expedicoes/${id}/envio`, {
      transportadora,
      guiaTransporte,
    });
    return response.data.data;
  },
};
