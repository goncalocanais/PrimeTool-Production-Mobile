import {supabase} from '../lib/supabase';

function toISODate(d?: string): string | undefined {
  if (!d) return undefined;
  const parts = d.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
}

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

function base64ToUint8Array(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const outputLen = Math.floor(len * 3 / 4) - (clean[len - 1] === '=' ? 1 : 0) - (clean[len - 2] === '=' ? 1 : 0);
  const bytes = new Uint8Array(outputLen);
  let i = 0, j = 0;
  while (i < len) {
    const a = lookup[clean.charCodeAt(i++)], b = lookup[clean.charCodeAt(i++)];
    const c = lookup[clean.charCodeAt(i++)], d = lookup[clean.charCodeAt(i++)];
    bytes[j++] = (a << 2) | (b >> 4);
    if (j < outputLen) bytes[j++] = ((b & 15) << 4) | (c >> 2);
    if (j < outputLen) bytes[j++] = ((c & 3) << 6) | d;
  }
  return bytes;
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

  async create(params: {ordemId: number; titulo: string; descricao: string; dataPrevista?: string; observacoes?: string}): Promise<void> {
    const {error} = await supabase
      .from('montagem_tarefamontagem')
      .insert({
        titulo: params.titulo,
        descricao: params.descricao,
        estado: 'pendente',
        data_prevista: toISODate(params.dataPrevista) || null,
        observacoes: params.observacoes || '',
        ordem_id: params.ordemId,
        tempo_previsto: '00:00:00',
        criado_em: new Date().toISOString(),
      });
    if (error) throw error;
  },

  async getFotos(tarefaId: number): Promise<{id: number; url: string}[]> {
    const {data, error} = await supabase
      .from('montagem_foto')
      .select('id, url')
      .eq('tarefa_id', tarefaId)
      .order('criado_em', {ascending: true});
    if (error) throw error;
    return data ?? [];
  },

  async uploadFoto(tarefaId: number, base64: string, mimeType: string): Promise<void> {
    const ext = mimeType.includes('png') ? 'png' : 'jpg';
    const path = `${tarefaId}/${Date.now()}.${ext}`;
    const bytes = base64ToUint8Array(base64);
    const {error: uploadError} = await supabase.storage
      .from('montagem-fotos')
      .upload(path, bytes, {contentType: mimeType, upsert: false});
    if (uploadError) throw uploadError;
    const {data: {publicUrl}} = supabase.storage.from('montagem-fotos').getPublicUrl(path);
    const {error: dbError} = await supabase.from('montagem_foto').insert({
      tarefa_id: tarefaId,
      url: publicUrl,
      nome: path,
      criado_em: new Date().toISOString(),
    });
    if (dbError) throw dbError;
  },

  async deleteFoto(id: number): Promise<void> {
    const {error} = await supabase.from('montagem_foto').delete().eq('id', id);
    if (error) throw error;
  },

  async closeOrdem(ordemId: number): Promise<void> {
    const {error} = await supabase
      .from('producao_ordemproducao')
      .update({estado: 'concluida', atualizado_em: new Date().toISOString()})
      .eq('id', ordemId);
    if (error) throw error;
  },
};
