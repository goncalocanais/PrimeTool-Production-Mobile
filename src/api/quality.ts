import {apiClient} from './client';
import {InspeccaoQualidade, NaoConformidade} from '../types';

export const qualityApi = {
  async getInspeccoes(ordemId?: number): Promise<InspeccaoQualidade[]> {
    const response = await apiClient.get('/inspeccoes', {params: ordemId ? {ordemId} : {}});
    return response.data.data;
  },

  async getById(id: number): Promise<InspeccaoQualidade> {
    const response = await apiClient.get(`/inspeccoes/${id}`);
    return response.data.data;
  },

  async create(data: Partial<InspeccaoQualidade>): Promise<InspeccaoQualidade> {
    const response = await apiClient.post('/inspeccoes', data);
    return response.data.data;
  },

  async registarResultado(
    id: number,
    resultado: string,
    observacoes?: string,
  ): Promise<InspeccaoQualidade> {
    const response = await apiClient.patch(`/inspeccoes/${id}/resultado`, {resultado, observacoes});
    return response.data.data;
  },

  async getNaoConformidades(inspeccaoId?: number): Promise<NaoConformidade[]> {
    const response = await apiClient.get('/nao-conformidades', {
      params: inspeccaoId ? {inspeccaoId} : {},
    });
    return response.data.data;
  },

  async createNaoConformidade(data: Partial<NaoConformidade>): Promise<NaoConformidade> {
    const response = await apiClient.post('/nao-conformidades', data);
    return response.data.data;
  },

  async updateNaoConformidade(id: number, data: Partial<NaoConformidade>): Promise<NaoConformidade> {
    const response = await apiClient.put(`/nao-conformidades/${id}`, data);
    return response.data.data;
  },
};
