import {apiClient} from './client';
import {Colaborador, Departamento} from '../types';

export const hrApi = {
  async getColaboradores(search?: string): Promise<Colaborador[]> {
    const response = await apiClient.get('/colaboradores', {params: search ? {search} : {}});
    return response.data.data;
  },

  async getColaboradorById(id: number): Promise<Colaborador> {
    const response = await apiClient.get(`/colaboradores/${id}`);
    return response.data.data;
  },

  async createColaborador(data: Partial<Colaborador>): Promise<Colaborador> {
    const response = await apiClient.post('/colaboradores', data);
    return response.data.data;
  },

  async updateColaborador(id: number, data: Partial<Colaborador>): Promise<Colaborador> {
    const response = await apiClient.put(`/colaboradores/${id}`, data);
    return response.data.data;
  },

  async getDepartamentos(): Promise<Departamento[]> {
    const response = await apiClient.get('/departamentos');
    return response.data.data;
  },

  async createDepartamento(data: Partial<Departamento>): Promise<Departamento> {
    const response = await apiClient.post('/departamentos', data);
    return response.data.data;
  },

  async getDashboardKPIs(): Promise<any> {
    const response = await apiClient.get('/dashboard/kpis');
    return response.data.data;
  },
};
