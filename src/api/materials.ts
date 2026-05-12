import {supabase} from '../lib/supabase';
import {Material, PedidoMaterial, PedidoCompra, MovimentoStock} from '../types';

function mapMaterial(row: any): Material {
  return {
    id: row.id,
    codigo: row.referencia,
    nome: row.nome,
    descricao: row.descricao || undefined,
    categoria: row.categoria_obj?.nome ?? undefined,
    unidade: row.unidade,
    stockAtual: Number(row.stock_atual),
    stockMinimo: Number(row.stock_minimo),
    stockMaximo: Number(row.stock_minimo) * 3,
    localizacao: row.localizacao || undefined,
    fornecedor: row.fornecedor_obj?.nome ?? undefined,
    precoUnitario: undefined,
  };
}

export const materialsApi = {
  async getAll(search?: string): Promise<Material[]> {
    let query = supabase
      .from('armazem_material')
      .select(`
        id, referencia, nome, descricao, unidade,
        stock_atual, stock_minimo, localizacao, ativo,
        categoria_obj:armazem_categoria!categoria_id(id, nome),
        fornecedor_obj:planeamento_cliente!fornecedor_id(id, nome)
      `)
      .eq('ativo', true)
      .order('nome');

    if (search) {
      query = query.or(`nome.ilike.%${search}%,referencia.ilike.%${search}%`);
    }

    const {data, error} = await query;
    if (error) throw error;
    return (data ?? []).map(mapMaterial);
  },

  async getById(id: number): Promise<Material> {
    const {data, error} = await supabase
      .from('armazem_material')
      .select(`
        id, referencia, nome, descricao, unidade,
        stock_atual, stock_minimo, localizacao, ativo,
        categoria_obj:armazem_categoria!categoria_id(id, nome),
        fornecedor_obj:planeamento_cliente!fornecedor_id(id, nome)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return mapMaterial(data);
  },

  async getAlertasStockMinimo(): Promise<Material[]> {
    const {data, error} = await supabase
      .from('armazem_material')
      .select(`
        id, referencia, nome, descricao, unidade,
        stock_atual, stock_minimo, localizacao, ativo,
        categoria_obj:armazem_categoria!categoria_id(id, nome),
        fornecedor_obj:planeamento_cliente!fornecedor_id(id, nome)
      `)
      .eq('ativo', true)
      .filter('stock_atual', 'lte', 'stock_minimo');
    if (error) throw error;
    return (data ?? []).map(mapMaterial);
  },

  async getMovimentos(materialId?: number): Promise<MovimentoStock[]> {
    let query = supabase
      .from('armazem_movimentostock')
      .select(`
        id, tipo, quantidade, quantidade_anterior, quantidade_posterior,
        motivo, referencia_doc, data, material_id,
        user_obj:core_user!utilizador_id(first_name, last_name)
      `)
      .order('data', {ascending: false});

    if (materialId) query = query.eq('material_id', materialId);

    const {data, error} = await query;
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      materialId: row.material_id,
      tipo: row.tipo as any,
      quantidade: Number(row.quantidade),
      quantidadeAnterior: Number(row.quantidade_anterior),
      quantidadeApos: Number(row.quantidade_posterior),
      motivo: row.motivo || undefined,
      utilizador: row.user_obj
        ? `${row.user_obj.first_name} ${row.user_obj.last_name}`.trim()
        : '—',
      data: row.data,
    }));
  },

  async registarMovimento(movData: Partial<MovimentoStock>): Promise<MovimentoStock> {
    const {data: mat, error: matErr} = await supabase
      .from('armazem_material')
      .select('stock_atual')
      .eq('id', movData.materialId)
      .single();
    if (matErr) throw matErr;

    const anterior = Number(mat.stock_atual);
    const posterior =
      movData.tipo === 'entrada' || movData.tipo === 'ajuste'
        ? anterior + Number(movData.quantidade)
        : anterior - Number(movData.quantidade);

    const {data, error} = await supabase
      .from('armazem_movimentostock')
      .insert({
        tipo: movData.tipo,
        quantidade: movData.quantidade,
        quantidade_anterior: anterior,
        quantidade_posterior: posterior,
        motivo: movData.motivo ?? '',
        referencia_doc: '',
        data: new Date().toISOString(),
        material_id: movData.materialId,
      })
      .select()
      .single();
    if (error) throw error;

    await supabase
      .from('armazem_material')
      .update({stock_atual: posterior})
      .eq('id', movData.materialId);

    return {
      id: data.id,
      materialId: data.material_id,
      tipo: data.tipo,
      quantidade: Number(data.quantidade),
      quantidadeAnterior: anterior,
      quantidadeApos: posterior,
      motivo: data.motivo || undefined,
      utilizador: '—',
      data: data.data,
    };
  },

  async getPedidosMaterial(status?: string): Promise<PedidoMaterial[]> {
    let query = supabase
      .from('producao_pedidomaterialadicional')
      .select(`
        id, descricao_material, quantidade, unidade, justificacao,
        observacoes, estado, pedido_em, processado_em,
        quantidade_entregue, ordem_id, material_id,
        pedido_por_obj:core_user!pedido_por_id(first_name, last_name),
        processado_por_obj:core_user!processado_por_id(first_name, last_name),
        material_obj:armazem_material!material_id(id, referencia, nome, unidade, stock_atual, stock_minimo)
      `)
      .order('pedido_em', {ascending: false});

    if (status) query = query.eq('estado', status);

    const {data, error} = await query;
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      referencia: `PM-${String(row.id).padStart(4, '0')}`,
      ordemProducaoId: row.ordem_id,
      materialId: row.material_id ?? 0,
      material: row.material_obj ? mapMaterial({...row.material_obj, localizacao: '', ativo: true}) : undefined,
      quantidade: Number(row.quantidade),
      justificacao: row.justificacao,
      status: row.estado as any,
      solicitadoPor: row.pedido_por_obj
        ? `${row.pedido_por_obj.first_name} ${row.pedido_por_obj.last_name}`.trim()
        : '—',
      solicitadoEm: row.pedido_em,
      respondidoPor: row.processado_por_obj
        ? `${row.processado_por_obj.first_name} ${row.processado_por_obj.last_name}`.trim()
        : undefined,
      respondidoEm: row.processado_em ?? undefined,
      observacaoResposta: row.observacoes || undefined,
      entregueEm: row.estado === 'entregue' ? row.processado_em : undefined,
    }));
  },

  async getPedidoMaterialById(id: number): Promise<PedidoMaterial> {
    const all = await materialsApi.getPedidosMaterial();
    const found = all.find(p => p.id === id);
    if (!found) throw new Error('Pedido não encontrado');
    return found;
  },

  async createPedidoMaterial(pedido: Partial<PedidoMaterial>): Promise<PedidoMaterial> {
    const {data, error} = await supabase
      .from('producao_pedidomaterialadicional')
      .insert({
        descricao_material: pedido.material?.nome ?? `Material #${pedido.materialId}`,
        quantidade: pedido.quantidade,
        unidade: pedido.material?.unidade ?? 'un',
        justificacao: pedido.justificacao ?? '',
        observacoes: '',
        estado: 'pendente',
        pedido_em: new Date().toISOString(),
        ordem_id: pedido.ordemProducaoId,
        material_id: pedido.materialId,
      })
      .select()
      .single();
    if (error) throw error;
    return {
      id: data.id,
      referencia: `PM-${String(data.id).padStart(4, '0')}`,
      ordemProducaoId: data.ordem_id,
      materialId: data.material_id,
      quantidade: Number(data.quantidade),
      justificacao: data.justificacao,
      status: data.estado,
      solicitadoPor: '—',
      solicitadoEm: data.pedido_em,
    };
  },

  async responderPedido(id: number, status: string, observacao?: string): Promise<void> {
    const {error} = await supabase
      .from('producao_pedidomaterialadicional')
      .update({
        estado: status,
        observacoes: observacao ?? '',
        processado_em: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async entregarPedido(id: number): Promise<void> {
    const {error} = await supabase
      .from('producao_pedidomaterialadicional')
      .update({estado: 'entregue', processado_em: new Date().toISOString()})
      .eq('id', id);
    if (error) throw error;
  },

  async getPedidosCompra(status?: string): Promise<PedidoCompra[]> {
    let query = supabase
      .from('armazem_pedidocompra')
      .select(`
        id, referencia, fornecedor, estado, data_pedido,
        data_entrega_prevista, data_entrega_real, observacoes, criado_em,
        criado_por_obj:core_user!criado_por_id(first_name, last_name),
        itens:armazem_itempedidocompra(id, quantidade, qty_recebida, material_id)
      `)
      .order('data_pedido', {ascending: false});

    if (status) query = query.eq('estado', status);

    const {data, error} = await query;
    if (error) throw error;
    return (data ?? []).map((row: any) => {
      const item = row.itens?.[0];
      const criador = row.criado_por_obj;
      return {
        id: row.id,
        referencia: row.referencia,
        fornecedor: row.fornecedor,
        materialId: item?.material_id ?? 0,
        quantidade: item ? Number(item.quantidade) : 0,
        quantidadeRecebida: item ? Number(item.qty_recebida) : 0,
        precoUnitario: 0,
        status: row.estado as any,
        dataPedido: row.data_pedido,
        dataEntregaPrevista: row.data_entrega_prevista ?? undefined,
        dataEntregaReal: row.data_entrega_real ?? undefined,
        criadoPor: criador
          ? `${criador.first_name} ${criador.last_name}`.trim()
          : '—',
      };
    });
  },

  async createPedidoCompra(pedido: Partial<PedidoCompra>): Promise<PedidoCompra> {
    const ref = `PC-${Date.now()}`;
    const {data, error} = await supabase
      .from('armazem_pedidocompra')
      .insert({
        referencia: ref,
        fornecedor: pedido.fornecedor ?? '',
        estado: 'pendente',
        data_pedido: new Date().toISOString().split('T')[0],
        data_entrega_prevista: pedido.dataEntregaPrevista,
        observacoes: '',
        criado_em: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;

    if (pedido.materialId) {
      await supabase.from('armazem_itempedidocompra').insert({
        pedido_id: data.id,
        material_id: pedido.materialId,
        quantidade: pedido.quantidade ?? 0,
        qty_recebida: 0,
      });
    }

    return {
      id: data.id,
      referencia: data.referencia,
      fornecedor: data.fornecedor,
      materialId: pedido.materialId ?? 0,
      quantidade: pedido.quantidade ?? 0,
      quantidadeRecebida: 0,
      precoUnitario: 0,
      status: data.estado,
      dataPedido: data.data_pedido,
      dataEntregaPrevista: pedido.dataEntregaPrevista,
      criadoPor: '—',
    };
  },

  async createMaterial(mat: {codigo: string; nome: string; unidade: string; stockMinimo: number; localizacao: string}): Promise<Material> {
    const {data, error} = await supabase
      .from('armazem_material')
      .insert({
        referencia: mat.codigo,
        nome: mat.nome,
        descricao: '',
        unidade: mat.unidade,
        stock_atual: 0,
        stock_minimo: mat.stockMinimo,
        localizacao: mat.localizacao,
        ativo: true,
      })
      .select(`id, referencia, nome, descricao, unidade, stock_atual, stock_minimo, localizacao, ativo,
        categoria_obj:armazem_categoria!categoria_id(id, nome),
        fornecedor_obj:planeamento_cliente!fornecedor_id(id, nome)`)
      .single();
    if (error) throw error;
    return mapMaterial(data);
  },

  async registarRecepcao(id: number, quantidadeRecebida: number, _total: number): Promise<void> {
    const {data: pedido, error: pedErr} = await supabase
      .from('armazem_pedidocompra')
      .select('itens:armazem_itempedidocompra(id, quantidade, qty_recebida)')
      .eq('id', id)
      .single();
    if (pedErr) throw pedErr;

    const item = pedido.itens?.[0];
    if (item) {
      const novaQty = Number(item.qty_recebida) + quantidadeRecebida;
      const total = Number(item.quantidade);
      const estado = novaQty >= total ? 'recebido' : 'recepcao_parcial';

      await supabase
        .from('armazem_itempedidocompra')
        .update({qty_recebida: novaQty})
        .eq('id', item.id);

      await supabase
        .from('armazem_pedidocompra')
        .update({estado, data_entrega_real: new Date().toISOString().split('T')[0]})
        .eq('id', id);
    }
  },
};
