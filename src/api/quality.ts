import {supabase} from '../lib/supabase';
import {InspeccaoQualidade, NaoConformidade} from '../types';

function mapInspeccao(row: any): InspeccaoQualidade {
  const inspector = row.inspector_obj;
  const ordem = row.ordem_obj;
  return {
    id: row.id,
    referencia: `INS-${String(row.id).padStart(4, '0')}`,
    ordemProducaoId: row.ordem_id,
    ordemProducao: ordem
      ? {
          id: ordem.id,
          referencia: ordem.referencia,
          cliente: '',
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
    tipo: row.tipo as any,
    resultado: row.resultado || undefined,
    inspector: inspector
      ? `${inspector.first_name} ${inspector.last_name}`.trim()
      : '—',
    dataInspeccao: row.data,
    observacoes: row.observacoes || undefined,
    naoConformidades: row.nao_conformidades
      ? [{
          id: row.id,
          inspeccaoId: row.id,
          descricao: row.nao_conformidades,
          gravidade: 'menor' as const,
          acaoCorretiva: row.acoes_corretivas || undefined,
          status: 'aberta' as const,
        }]
      : [],
  };
}

export const qualityApi = {
  async getInspeccoes(ordemId?: number): Promise<InspeccaoQualidade[]> {
    let query = supabase
      .from('qualidade_inspecaoqualidade')
      .select(`
        id, data, resultado, observacoes, nao_conformidades, acoes_corretivas, tipo, ordem_id,
        inspector_obj:core_user!inspector_id(first_name, last_name),
        ordem_obj:producao_ordemproducao!ordem_id(id, referencia, nome, estado)
      `)
      .order('data', {ascending: false});

    if (ordemId) query = query.eq('ordem_id', ordemId);

    const {data, error} = await query;
    if (error) throw error;
    return (data ?? []).map(mapInspeccao);
  },

  async getById(id: number): Promise<InspeccaoQualidade> {
    const {data, error} = await supabase
      .from('qualidade_inspecaoqualidade')
      .select(`
        id, data, resultado, observacoes, nao_conformidades, acoes_corretivas, tipo, ordem_id,
        inspector_obj:core_user!inspector_id(first_name, last_name),
        ordem_obj:producao_ordemproducao!ordem_id(id, referencia, nome, estado)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapInspeccao(data);
  },

  async create(inspeccaoData: Partial<InspeccaoQualidade>): Promise<InspeccaoQualidade> {
    const {data, error} = await supabase
      .from('qualidade_inspecaoqualidade')
      .insert({
        tipo: inspeccaoData.tipo ?? 'final',
        resultado: inspeccaoData.resultado ?? '',
        observacoes: inspeccaoData.observacoes ?? '',
        nao_conformidades: '',
        acoes_corretivas: '',
        data: new Date().toISOString(),
        ordem_id: inspeccaoData.ordemProducaoId,
      })
      .select(`
        id, data, resultado, observacoes, nao_conformidades, acoes_corretivas, tipo, ordem_id,
        inspector_obj:core_user!inspector_id(first_name, last_name),
        ordem_obj:producao_ordemproducao!ordem_id(id, referencia, nome, estado)
      `)
      .single();
    if (error) throw error;
    return mapInspeccao(data);
  },

  async registarResultado(
    id: number,
    resultado: string,
    observacoes?: string,
  ): Promise<InspeccaoQualidade> {
    const {data, error} = await supabase
      .from('qualidade_inspecaoqualidade')
      .update({resultado, observacoes: observacoes ?? ''})
      .eq('id', id)
      .select(`
        id, data, resultado, observacoes, nao_conformidades, acoes_corretivas, tipo, ordem_id,
        inspector_obj:core_user!inspector_id(first_name, last_name),
        ordem_obj:producao_ordemproducao!ordem_id(id, referencia, nome, estado)
      `)
      .single();
    if (error) throw error;
    return mapInspeccao(data);
  },

  async getNaoConformidades(inspeccaoId?: number): Promise<NaoConformidade[]> {
    // nao_conformidades is a text field in this schema, not a separate table.
    // Return empty array if no inspeccaoId provided.
    if (!inspeccaoId) return [];
    const {data, error} = await supabase
      .from('qualidade_inspecaoqualidade')
      .select('id, nao_conformidades, acoes_corretivas')
      .eq('id', inspeccaoId)
      .single();
    if (error) throw error;
    if (!data.nao_conformidades) return [];
    return [{
      id: data.id,
      inspeccaoId: inspeccaoId,
      descricao: data.nao_conformidades,
      gravidade: 'menor',
      acaoCorretiva: data.acoes_corretivas || undefined,
      status: 'aberta',
    }];
  },

  async createNaoConformidade(ncData: Partial<NaoConformidade>): Promise<NaoConformidade> {
    const {error} = await supabase
      .from('qualidade_inspecaoqualidade')
      .update({
        nao_conformidades: ncData.descricao ?? '',
        acoes_corretivas: ncData.acaoCorretiva ?? '',
      })
      .eq('id', ncData.inspeccaoId);
    if (error) throw error;
    return {
      id: ncData.inspeccaoId ?? 0,
      inspeccaoId: ncData.inspeccaoId ?? 0,
      descricao: ncData.descricao ?? '',
      gravidade: ncData.gravidade ?? 'menor',
      acaoCorretiva: ncData.acaoCorretiva,
      status: 'aberta',
    };
  },

  async updateNaoConformidade(id: number, updates: Partial<NaoConformidade>): Promise<NaoConformidade> {
    const {error} = await supabase
      .from('qualidade_inspecaoqualidade')
      .update({
        nao_conformidades: updates.descricao,
        acoes_corretivas: updates.acaoCorretiva ?? '',
      })
      .eq('id', id);
    if (error) throw error;
    return {id, inspeccaoId: id, descricao: updates.descricao ?? '', gravidade: 'menor', status: 'aberta'};
  },
};
