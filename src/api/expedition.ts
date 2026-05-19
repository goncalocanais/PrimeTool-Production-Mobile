import {supabase} from '../lib/supabase';
import {Expedicao} from '../types';
import {notificacoesApi} from './notificacoes';

function toISODate(d?: string): string | undefined {
  if (!d) return undefined;
  const parts = d.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
}

function mapExpedicao(row: any): Expedicao {
  const responsavel = row.responsavel_obj;
  const ordem = row.ordem_obj;
  return {
    id: row.id,
    referencia: row.referencia,
    ordemProducaoId: row.ordem_id,
    ordemProducao: ordem
      ? {
          id: ordem.id,
          referencia: ordem.referencia,
          cliente: ordem.cliente_obj?.nome ?? '—',
          descricao: ordem.nome ?? '',
          quantidade: 1,
          dataInicio: '',
          dataFimPrevista: '',
          status: ordem.estado,
          prioridade: 'media',
          progresso: 0,
          createdAt: '',
          updatedAt: '',
        }
      : undefined,
    destinatario: ordem?.cliente_obj?.nome ?? row.morada_entrega.split('\n')[0] ?? '—',
    moradaEntrega: row.morada_entrega,
    transportadora: row.transportadora || undefined,
    guiaTransporte: row.guia_transporte || undefined,
    status: row.estado as any,
    dataPrevisaoEntrega: row.data_prevista_envio ?? undefined,
    dataEnvio: row.data_real_envio ?? undefined,
    dataEntrega: undefined,
    peso: undefined,
    volumes: undefined,
    observacoes: row.observacoes || undefined,
    criadoPor: responsavel
      ? `${responsavel.first_name} ${responsavel.last_name}`.trim()
      : '—',
  };
}

const SELECT_EXPEDICAO = `
  id, referencia, estado, data_prevista_envio, data_real_envio,
  transportadora, guia_transporte, morada_entrega, observacoes,
  criado_em, ordem_id,
  responsavel_obj:core_user!responsavel_id(first_name, last_name),
  ordem_obj:producao_ordemproducao!ordem_id(
    id, referencia, nome, estado,
    cliente_obj:planeamento_cliente!cliente_id(id, nome)
  )
`;

export const expeditionApi = {

  async getAll(status?: string): Promise<Expedicao[]> {
    let query = supabase
      .from('expedicao_expedicao')
      .select(SELECT_EXPEDICAO)
      .order('criado_em', {ascending: false});

    if (status) query = query.eq('estado', status);

    const {data, error} = await query;
    if (error) throw error;
    return (data ?? []).map(mapExpedicao);
  },

  async getById(id: number): Promise<Expedicao> {
    const {data, error} = await supabase
      .from('expedicao_expedicao')
      .select(SELECT_EXPEDICAO)
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapExpedicao(data);
  },

  async create(expData: Partial<Expedicao>): Promise<Expedicao> {
    const ref = expData.guiaTransporte ? `EXP-${expData.guiaTransporte}` : `EXP-${Date.now()}`;
    const {data, error} = await supabase
      .from('expedicao_expedicao')
      .insert({
        referencia: ref,
        estado: 'pendente',
        transportadora: expData.transportadora ?? '',
        guia_transporte: expData.guiaTransporte ?? '',
        morada_entrega: expData.moradaEntrega ?? '',
        observacoes: expData.observacoes ?? '',
        criado_em: new Date().toISOString(),
        data_prevista_envio: toISODate(expData.dataPrevisaoEntrega),
        ordem_id: expData.ordemProducaoId,
        codigo_at: `AT-${String(Date.now()).slice(-9)}`,
      })
      .select(SELECT_EXPEDICAO)
      .single();
    if (error) throw error;
    return mapExpedicao(data);
  },

  async update(id: number, expData: Partial<Expedicao>): Promise<Expedicao> {
    const {data, error} = await supabase
      .from('expedicao_expedicao')
      .update({
        estado: expData.status,
        transportadora: expData.transportadora,
        guia_transporte: expData.guiaTransporte,
        morada_entrega: expData.moradaEntrega,
        observacoes: expData.observacoes,
        data_prevista_envio: expData.dataPrevisaoEntrega,
      })
      .eq('id', id)
      .select(SELECT_EXPEDICAO)
      .single();
    if (error) throw error;
    return mapExpedicao(data);
  },

  async updateStatus(id: number, status: string): Promise<Expedicao> {
    const {data, error} = await supabase
      .from('expedicao_expedicao')
      .update({estado: status})
      .eq('id', id)
      .select(SELECT_EXPEDICAO)
      .single();
    if (error) throw error;
    const exp = mapExpedicao(data);
    const ref = exp.ordemProducao?.referencia ?? exp.referencia;
    const opId = exp.ordemProducaoId;
    if (status === 'enviado') {
      notificacoesApi.create('montagem', 'OP em trânsito', `OP ${ref} a caminho do cliente. Preparar equipa de montagem.`, opId).catch(() => {});
    } else if (status === 'entregue') {
      notificacoesApi.create('montagem', 'OP entregue no cliente', `OP ${ref} chegou ao destino. Proceder com a montagem.`, opId).catch(() => {});
    }
    return exp;
  },

  async registarEnvio(
    id: number,
    transportadora: string,
    guiaTransporte: string,
  ): Promise<Expedicao> {
    const {data, error} = await supabase
      .from('expedicao_expedicao')
      .update({
        estado: 'enviado',
        transportadora,
        guia_transporte: guiaTransporte,
        data_real_envio: new Date().toISOString(),
      })
      .eq('id', id)
      .select(SELECT_EXPEDICAO)
      .single();
    if (error) throw error;
    return mapExpedicao(data);
  },
};
