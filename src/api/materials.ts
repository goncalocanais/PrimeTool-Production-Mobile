import {apiClient} from './client';
import {Material, PedidoMaterial, PedidoCompra, MovimentoStock} from '../types';

export const materialsApi = {
  async getAll(search?: string): Promise<Material[]> {
    const response = await apiClient.get('/materiais', {params: search ? {search} : {}});
    return response.data.data;
  },

  async getById(id: number): Promise<Material> {
    const response = await apiClient.get(`/materiais/${id}`);
    return response.data.data;
  },

  async getAlertasStockMinimo(): Promise<Material[]> {
    const response = await apiClient.get('/materiais/alertas-stock');
    return response.data.data;
  },

  // Movimentos de stock
  async getMovimentos(materialId?: number): Promise<MovimentoStock[]> {
    const response = await apiClient.get('/movimentos-stock', {
      params: materialId ? {materialId} : {},
    });
    return response.data.data;
  },

  async registarMovimento(data: Partial<MovimentoStock>): Promise<MovimentoStock> {
    const response = await apiClient.post('/movimentos-stock', data);
    return response.data.data;
  },

  // Pedidos de material
  async getPedidosMaterial(status?: string): Promise<PedidoMaterial[]> {
    const response = await apiClient.get('/pedidos-material', {params: status ? {status} : {}});
    return response.data.data;
  },

  async getPedidoMaterialById(id: number): Promise<PedidoMaterial> {
    const response = await apiClient.get(`/pedidos-material/${id}`);
    return response.data.data;
  },

  async createPedidoMaterial(data: Partial<PedidoMaterial>): Promise<PedidoMaterial> {
    const response = await apiClient.post('/pedidos-material', data);
    return response.data.data;
  },

  async responderPedido(id: number, status: string, observacao?: string): Promise<PedidoMaterial> {
    const response = await apiClient.patch(`/pedidos-material/${id}`, {status, observacao});
    return response.data.data;
  },

  async entregarPedido(id: number): Promise<PedidoMaterial> {
    const response = await apiClient.patch(`/pedidos-material/${id}/entregar`);
    return response.data.data;
  },

  // Pedidos de compra
  async getPedidosCompra(status?: string): Promise<PedidoCompra[]> {
    const response = await apiClient.get('/pedidos-compra', {params: status ? {status} : {}});
    return response.data.data;
  },

  async createPedidoCompra(data: Partial<PedidoCompra>): Promise<PedidoCompra> {
    const response = await apiClient.post('/pedidos-compra', data);
    return response.data.data;
  },

  async registarRecepcao(
    id: number,
    quantidadeRecebida: number,
    total: boolean,
  ): Promise<PedidoCompra> {
    const response = await apiClient.patch(`/pedidos-compra/${id}/recepcao`, {
      quantidadeRecebida,
      total,
    });
    return response.data.data;
  },
};
