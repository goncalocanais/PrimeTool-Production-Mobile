import {supabase} from '../lib/supabase';
import {OrdemProducao, OPStatus, PedidoAssistencia, RegistoProgresso} from '../types';

function nameFromUser(u: any): string {
  if (!u) return '—';
  return `${u.first_name} ${u.last_name}`.trim() || '—';
}

function mapOrdem(row: any): OrdemProducao {
  return {
    id: row.id,
    referencia: row.referencia,
    cliente: row.cliente_obj?.nome ?? '—',
    descricao: row.nome ?? row.descricao ?? '',
    quantidade: 1,
    dataInicio: row.data_prevista_inicio ?? row.criado_em ?? '',
    dataFimPrevista: row.data_prevista_fim ?? row.data_entrega_prevista ?? '',
    dataFimReal: row.data_real_fim ?? undefined,
    status: row.estado as OPStatus,
    prioridade: (row.prioridade as any) ?? 'media',
    progresso: 0,
    responsavel: row.responsavel_obj ? nameFromUser(row.responsavel_obj) : undefined,
    observacoes: row.observacoes || undefined,
    createdAt: row.criado_em ?? '',
    updatedAt: row.atualizado_em ?? '',
  };
}

const SELECT_ORDEM = `
  id, referencia, nome, descricao, estado, prioridade,
  data_prevista_inicio, data_prevista_fim,
  data_real_inicio, data_real_fim,
  data_entrega_prevista, data_entrega_real,
  observacoes, criado_em, atualizado_em,
  cliente_obj:planeamento_cliente!cliente_id(id, nome),
  responsavel_obj:core_user!responsavel_id(id, first_name, last_name)
`;

export const ordersApi = {
  async getAll(params: {status?: OPStatus; search?: string} = {}): Promise<OrdemProducao[]> {
    let query = supabase
      .from('producao_ordemproducao')
      .select(SELECT_ORDEM)
      .order('criado_em', {ascending: false});

    if (params.status) query = query.eq('estado', params.status);
    if (params.search) {
      query = query.or(`referencia.ilike.%${params.search}%,nome.ilike.%${params.search}%`);
    }

    const {data, error} = await query;
    if (error) throw error;
    return (data ?? []).map(mapOrdem);
  },

  async getById(id: number): Promise<OrdemProducao> {
    const {data, error} = await supabase
      .from('producao_ordemproducao')
      .select(SELECT_ORDEM)
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapOrdem(data);
  },

  async create(orderData: Partial<OrdemProducao> & {clienteId?: number}): Promise<OrdemProducao> {
    const {data, error} = await supabase
      .from('producao_ordemproducao')
      .insert({
        referencia: orderData.referencia,
        nome: orderData.descricao ?? '',
        descricao: orderData.descricao ?? '',
        estado: orderData.status ?? 'planeamento',
        prioridade: orderData.prioridade ?? 'media',
        data_prevista_inicio: orderData.dataInicio,
        data_prevista_fim: orderData.dataFimPrevista,
        observacoes: orderData.observacoes ?? '',
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        cliente_id: orderData.clienteId ?? 1,
      })
      .select(SELECT_ORDEM)
      .single();
    if (error) throw error;
    return mapOrdem(data);
  },

  async update(id: number, orderData: Partial<OrdemProducao>): Promise<OrdemProducao> {
    const {data, error} = await supabase
      .from('producao_ordemproducao')
      .update({
        descricao: orderData.descricao,
        estado: orderData.status,
        prioridade: orderData.prioridade,
        observacoes: orderData.observacoes,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .select(SELECT_ORDEM)
      .single();
    if (error) throw error;
    return mapOrdem(data);
  },

  async updateStatus(id: number, status: OPStatus): Promise<OrdemProducao> {
    const {data, error} = await supabase
      .from('producao_ordemproducao')
      .update({estado: status, atualizado_em: new Date().toISOString()})
      .eq('id', id)
      .select(SELECT_ORDEM)
      .single();
    if (error) throw error;
    return mapOrdem(data);
  },

  async updateProgress(id: number, _progresso: number, descricao: string): Promise<void> {
    const {error} = await supabase.from('producao_registoproducao').insert({
      ordem_id: id,
      descricao,
      data: new Date().toISOString(),
    });
    if (error) throw error;
  },

  async getProgressHistory(id: number): Promise<RegistoProgresso[]> {
    const {data, error} = await supabase
      .from('producao_registoproducao')
      .select(`id, descricao, data, user_obj:core_user!utilizador_id(first_name, last_name)`)
      .eq('ordem_id', id)
      .order('data', {ascending: false});
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      ordemProducaoId: id,
      percentagem: 0,
      descricao: row.descricao,
      operador: nameFromUser(row.user_obj),
      data: row.data,
    }));
  },

  async getPedidosAssistencia(ordemId?: number): Promise<PedidoAssistencia[]> {
    let query = supabase
      .from('producao_pedidoassistencia')
      .select(`
        id, descricao, urgencia, estado, criado_em, resposta, respondido_em, ordem_id,
        criado_por_obj:core_user!criado_por_id(first_name, last_name),
        respondido_por_obj:core_user!respondido_por_id(first_name, last_name)
      `)
      .order('criado_em', {ascending: false});
    if (ordemId) query = query.eq('ordem_id', ordemId);
    const {data, error} = await query;
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      referencia: `ASS-${String(row.id).padStart(4, '0')}`,
      ordemProducaoId: row.ordem_id,
      titulo: (row.descricao as string).slice(0, 60),
      descricao: row.descricao,
      status: row.estado as any,
      prioridade: row.urgencia ?? 'media',
      solicitadoPor: nameFromUser(row.criado_por_obj),
      solicitadoEm: row.criado_em,
      respondidoPor: row.respondido_por_obj ? nameFromUser(row.respondido_por_obj) : undefined,
      respondidoEm: row.respondido_em ?? undefined,
      resposta: row.resposta || undefined,
    }));
  },

  async createPedidoAssistencia(pedido: Partial<PedidoAssistencia>): Promise<PedidoAssistencia> {
    const {data, error} = await supabase
      .from('producao_pedidoassistencia')
      .insert({
        descricao: pedido.descricao,
        urgencia: pedido.prioridade ?? 'media',
        estado: 'pendente',
        criado_em: new Date().toISOString(),
        resposta: '',
        ordem_id: pedido.ordemProducaoId,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      referencia: `ASS-${String(data.id).padStart(4, '0')}`,
      ordemProducaoId: data.ordem_id,
      titulo: (data.descricao as string).slice(0, 60),
      descricao: data.descricao,
      status: data.estado,
      prioridade: data.urgencia,
      solicitadoPor: '—',
      solicitadoEm: data.criado_em,
    };
  },

  async delete(id: number): Promise<void> {
    const {error} = await supabase.from('producao_ordemproducao').delete().eq('id', id);
    if (error) throw error;
  },

  async responderAssistencia(id: number, resposta: string, status: string): Promise<void> {
    const {error} = await supabase
      .from('producao_pedidoassistencia')
      .update({resposta, estado: status, respondido_em: new Date().toISOString()})
      .eq('id', id);
    if (error) throw error;
  },
};
