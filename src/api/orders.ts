import {supabase} from '../lib/supabase';
import {OrdemProducao, OPStatus, PedidoAssistencia, RegistoProgresso} from '../types';
import {notificacoesApi} from './notificacoes';

function toISODate(d?: string): string | undefined {
  if (!d) return undefined;
  const parts = d.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
}

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
  async getClientes(): Promise<{id: number; nome: string}[]> {
    const {data, error} = await supabase
      .from('planeamento_cliente')
      .select('id, nome')
      .order('nome', {ascending: true});
    if (error) throw error;
    return data ?? [];
  },

  async getNextReferencia(): Promise<string> {
    const year = new Date().getFullYear();
    const {data} = await supabase
      .from('producao_ordemproducao')
      .select('referencia')
      .like('referencia', `${year}-%`)
      .order('referencia', {ascending: false})
      .limit(1);
    if (data && data.length > 0) {
      const last = (data[0].referencia as string).split('-')[1];
      const num = parseInt(last, 10);
      if (!isNaN(num)) return `${year}-${String(num + 1).padStart(4, '0')}`;
    }
    return `${year}-0001`;
  },

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

  async create(orderData: Partial<OrdemProducao> & {clienteId?: number; criadoPorId?: number}): Promise<OrdemProducao> {
    const hoje = new Date().toISOString();
    const {data, error} = await supabase
      .from('producao_ordemproducao')
      .insert({
        referencia: orderData.referencia,
        nome: orderData.descricao ?? '',
        descricao: orderData.descricao ?? '',
        estado: orderData.status ?? 'planeamento',
        prioridade: orderData.prioridade ?? 'media',
        data_prevista_inicio: toISODate(orderData.dataInicio) ?? hoje,
        data_prevista_fim: toISODate(orderData.dataFimPrevista),
        data_entrega_prevista: toISODate(orderData.dataFimPrevista),
        data_planeamento: hoje,
        observacoes: orderData.observacoes ?? '',
        criado_em: hoje,
        atualizado_em: hoje,
        cliente_id: orderData.clienteId ?? 1,
        criado_por_id: (orderData.criadoPorId && orderData.criadoPorId > 0) ? orderData.criadoPorId : null,
      })
      .select(SELECT_ORDEM)
      .single();
    if (error) throw error;
    const op = mapOrdem(data);
    notificacoesApi.create(
      ['producao', 'armazem'],
      'Nova Ordem de Produção',
      `OP ${op.referencia} – ${op.descricao} foi criada e aguarda produção.`,
      op.id,
    ).catch(() => {});
    return op;
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
    const op = mapOrdem(data);
    if (status === 'qualidade') {
      notificacoesApi.create('qualidade', 'Verificação de qualidade pendente', `OP ${op.referencia} – ${op.descricao} concluída. Verificação necessária.`, id).catch(() => {});
    } else if (status === 'expedicao') {
      notificacoesApi.create('expedicao', 'OP pronta para expedição', `OP ${op.referencia} – ${op.descricao} aprovada na qualidade. Criar guia de transporte.`, id).catch(() => {});
    }
    return op;
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
    const childDeletes: {table: string; col: string}[] = [
      {table: 'producao_registoproducao',       col: 'ordem_id'},
      {table: 'producao_pedidoassistencia',      col: 'ordem_id'},
      {table: 'producao_pedidomaterialadicional',col: 'ordem_id'},
      {table: 'montagem_tarefamontagem',         col: 'ordem_id'},
      {table: 'qualidade_inspeccao',             col: 'ordem_id'},
    ];
    for (const {table, col} of childDeletes) {
      const {error: e} = await supabase.from(table).delete().eq(col, id);
      if (e) console.warn(`[delete cascade] ${table}:`, e);
    }
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
