import {supabase} from '../lib/supabase';

const SELECT_TAREFA = `
  id, titulo, descricao, estado, data_prevista, data_conclusao, observacoes, criado_em, tempo_previsto, ordem_id,
  ordem_obj:producao_ordemproducao!ordem_id(id, referencia, nome, cliente_obj:planeamento_cliente!cliente_id(id, nome)),
  responsavel_obj:core_user!responsavel_id(id, first_name, last_name)
`;

export type TarefaEstado = 'pendente' | 'em_curso' | 'concluida' | 'suspensa';

export interface TarefaMontagem {
  id: number;
  titulo: string;
  descricao: string;
  estado: TarefaEstado;
  dataPrevista?: string;
  dataConclusao?: string;
  observacoes?: string;
  criadoEm: string;
  ordemId: number;
  ordemReferencia?: string;
  ordemNome?: string;
  cliente?: string;
  responsavel?: string;
}

function mapTarefa(row: any): TarefaMontagem {
  const ordem = row.ordem_obj;
  const clienteObj = Array.isArray(ordem?.cliente_obj) ? ordem.cliente_obj[0] : ordem?.cliente_obj;
  const resp = row.responsavel_obj;
  return {
    id: row.id,
    titulo: row.titulo ?? '—',
    descricao: row.descricao ?? '',
    estado: row.estado ?? 'pendente',
    dataPrevista: row.data_prevista || undefined,
    dataConclusao: row.data_conclusao || undefined,
    observacoes: row.observacoes || undefined,
    criadoEm: row.criado_em,
    ordemId: row.ordem_id,
    ordemReferencia: ordem?.referencia,
    ordemNome: ordem?.nome,
    cliente: clienteObj?.nome,
    responsavel: resp ? `${resp.first_name} ${resp.last_name}`.trim() : undefined,
  };
}

export const montagensApi = {
  async getAll(): Promise<TarefaMontagem[]> {
    const {data, error} = await supabase
      .from('montagem_tarefamontagem')
      .select(SELECT_TAREFA)
      .order('criado_em', {ascending: false});
    if (error) throw error;
    return (data ?? []).map(mapTarefa);
  },

  async updateEstado(id: number, estado: TarefaEstado): Promise<void> {
    const updates: any = {estado};
    if (estado === 'concluida') updates.data_conclusao = new Date().toISOString();
    const {error} = await supabase
      .from('montagem_tarefamontagem')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async create(params: {ordemRef: string; titulo: string; descricao: string; dataPrevista?: string; observacoes?: string}): Promise<void> {
    const {data: orderData, error: orderError} = await supabase
      .from('producao_ordemproducao')
      .select('id')
      .eq('referencia', params.ordemRef.trim())
      .single();
    if (orderError) throw new Error(`OP "${params.ordemRef}" não encontrada`);
    const {error} = await supabase
      .from('montagem_tarefamontagem')
      .insert({
        titulo: params.titulo,
        descricao: params.descricao,
        estado: 'pendente',
        data_prevista: params.dataPrevista || null,
        observacoes: params.observacoes || '',
        ordem_id: orderData.id,
        tempo_previsto: '00:00:00',
      });
    if (error) throw error;
  },
};
