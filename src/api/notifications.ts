import {apiClient} from './client';

export interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'sucesso' | 'aviso' | 'erro';
  lida: boolean;
  link?: string;
  criadaEm: string;
}

export const notificationsApi = {
  async getAll(): Promise<Notificacao[]> {
    const response = await apiClient.get('/notificacoes');
    return response.data.data;
  },

  async marcarLida(id: number): Promise<void> {
    await apiClient.patch(`/notificacoes/${id}/lida`);
  },

  async marcarTodasLidas(): Promise<void> {
    await apiClient.patch('/notificacoes/marcar-todas-lidas');
  },

  async getTotalNaoLidas(): Promise<number> {
    const response = await apiClient.get('/notificacoes/nao-lidas/total');
    return response.data.total;
  },
};
