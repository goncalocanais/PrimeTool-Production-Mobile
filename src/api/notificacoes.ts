import {supabase} from '../lib/supabase';

export interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criado_em: string;
  op_id?: number;
}

export const notificacoesApi = {
  async getAll(perfil: string): Promise<Notificacao[]> {
    const {data, error} = await supabase
      .from('notificacoes')
      .select('id, titulo, mensagem, lida, criado_em, op_id')
      .eq('perfil_destino', perfil)
      .order('criado_em', {ascending: false})
      .limit(50);
    if (error) throw error;
    return data ?? [];
  },

  async getUnreadCount(perfil: string): Promise<number> {
    const {count, error} = await supabase
      .from('notificacoes')
      .select('id', {count: 'exact', head: true})
      .eq('perfil_destino', perfil)
      .eq('lida', false);
    if (error) return 0;
    return count ?? 0;
  },

  async markAsRead(id: number): Promise<void> {
    await supabase.from('notificacoes').update({lida: true}).eq('id', id);
  },

  async markAllAsRead(perfil: string): Promise<void> {
    await supabase.from('notificacoes').update({lida: true})
      .eq('perfil_destino', perfil)
      .eq('lida', false);
  },

  async deleteOne(id: number): Promise<void> {
    await supabase.from('notificacoes').delete().eq('id', id);
  },

  async deleteAll(perfil: string): Promise<void> {
    await supabase.from('notificacoes').delete().eq('perfil_destino', perfil);
  },

  async create(
    perfilDestino: string | string[],
    titulo: string,
    mensagem: string,
    opId?: number,
  ): Promise<void> {
    const perfis = Array.isArray(perfilDestino) ? perfilDestino : [perfilDestino];
    // direcao recebe sempre cópia de todas as notificações
    const allPerfis = perfis.includes('direcao') ? perfis : [...perfis, 'direcao'];
    const now = new Date().toISOString();
    const rows = allPerfis.map(p => ({
      perfil_destino: p,
      titulo,
      mensagem,
      lida: false,
      op_id: opId ?? null,
      criado_em: now,
    }));
    await supabase.from('notificacoes').insert(rows);
  },
};
