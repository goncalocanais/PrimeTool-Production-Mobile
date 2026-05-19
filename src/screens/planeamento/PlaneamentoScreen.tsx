import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, ActivityIndicator, RefreshControl,
} from 'react-native';
import {useRouter} from 'expo-router';
import {Search, ChevronDown, Plus, Pencil, Trash2, X, Check} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar, DateInput} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';
import {ordersApi} from '../../api/orders';
import {OrdemProducao, OPStatus} from '../../types';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;
const GREEN  = Colors.success;

// Mapeamento DB estado → label de ecrã
const ESTADO_LABEL: Record<string, string> = {
  planeamento:  'PLANEAMENTO',
  em_producao:  'EM PRODUÇÃO',
  montagem:     'EM MONTAGEM',
  expedicao:    'EM EXPEDIÇÃO',
  qualidade:    'EM QUALIDADE',
  concluida:    'CONCLUÍDA',
  cancelada:    'CANCELADA',
};

const ESTADO_STYLES: Record<string, {bg: string}> = {
  planeamento: {bg: Colors.primaryLight},
  em_producao: {bg: '#3b82f6'},
  montagem:    {bg: ORANGE},
  expedicao:   {bg: '#8b5cf6'},
  qualidade:   {bg: Colors.success},
  concluida:   {bg: GREEN},
  cancelada:   {bg: Colors.danger},
};

const DB_ESTADOS: OPStatus[] = ['planeamento','em_producao','montagem','expedicao','qualidade','concluida','cancelada'];
const FILTER_OPTS = ['Todos', ...DB_ESTADOS];

const PRIORIDADE_LABEL: Record<string, string> = {
  baixa: 'Normal', media: 'Média', alta: 'Alta', urgente: 'Alta',
};
const PRIORIDADE_DB: Record<string, OPStatus> = {};
const PRIORIDADE_COLORS: Record<string, string> = {
  Alta: Colors.danger, Média: ORANGE, Normal: Colors.primaryLight,
};

const toDate = (s?: string) => {
  if (!s) return '—';
  if (s.includes('/')) return s;
  const [y, m, d] = s.split('T')[0].split('-');
  return d && m && y ? `${d}/${m}/${y}` : '—';
};

const EMPTY_NOVA = {nome: '', cliente: '', dataInicio: '', dataFim: '', responsavel: '', prioridade: 'media' as OPStatus};

export const PlaneamentoScreen: React.FC = () => {
  const router  = useRouter();
  const user    = useAppSelector(s => s.auth.user);
  const canEdit = ['planeamento', 'direcao'].includes(user?.perfil ?? '');

  const [ordens, setOrdens]           = useState<OrdemProducao[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [search, setSearch]           = useState('');
  const [filter, setFilter]           = useState('Todos');
  const [filterOpen, setFilterOpen]   = useState(false);
  const [expandedId, setExpandedId]   = useState<number | null>(null);
  const [editingId, setEditingId]     = useState<number | null>(null);
  const [editData, setEditData]       = useState<{nome: string; dataInicio: string; dataFim: string; responsavel: string}>({nome: '', dataInicio: '', dataFim: '', responsavel: ''});
  const [deleteId, setDeleteId]       = useState<number | null>(null);
  const [showNova, setShowNova]       = useState(false);
  const [nova, setNova]               = useState(EMPTY_NOVA);
  const [estadoPickId, setEstadoPickId] = useState<number | null>(null);
  const [clientes, setClientes]       = useState<{id: number; nome: string}[]>([]);
  const [clienteId, setClienteId]     = useState<number | null>(null);
  const [showClientePicker, setShowClientePicker] = useState(false);

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, cls] = await Promise.all([
        ordersApi.getAll({search: search || undefined}),
        ordersApi.getClientes(),
      ]);
      setOrdens(data);
      setClientes(cls);
      if (cls.length > 0 && !clienteId) setClienteId(cls[0].id);
    } catch (e) {
      console.error('Erro ao carregar ordens:', e);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const filtered = ordens.filter(o =>
    filter === 'Todos' || o.status === filter,
  );

  const startEdit = (o: OrdemProducao) => {
    setEditingId(o.id);
    setEditData({nome: o.descricao, dataInicio: o.dataInicio, dataFim: o.dataFimPrevista, responsavel: o.responsavel ?? ''});
  };

  const saveEdit = async (id: number) => {
    try {
      await ordersApi.update(id, {
        descricao: editData.nome,
        dataInicio: editData.dataInicio,
        dataFimPrevista: editData.dataFim,
        responsavel: editData.responsavel,
      });
      setEditingId(null);
      load();
    } catch (e) {
      console.error('Erro ao guardar:', e);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await ordersApi.delete(deleteId);
      setDeleteId(null);
      if (expandedId === deleteId) setExpandedId(null);
      load();
    } catch (e) {
      console.error('Erro ao eliminar:', e);
      setDeleteId(null);
    }
  };

  const addOrdem = async () => {
    if (!nova.nome.trim() || !clienteId) return;
    try {
      const nextRef = await ordersApi.getNextReferencia();
      await ordersApi.create({
        referencia:     nextRef,
        descricao:      nova.nome,
        status:         'planeamento',
        prioridade:     nova.prioridade as any,
        dataInicio:     nova.dataInicio,
        dataFimPrevista:nova.dataFim,
        responsavel:    nova.responsavel,
        clienteId:      clienteId,
        criadoPorId:    user?.id,
      } as any);
      setNova(EMPTY_NOVA);
      setShowNova(false);
      load();
    } catch (e) {
      console.error('Erro ao criar ordem:', e);
    }
  };

  const handleEstadoChange = async (id: number, estado: OPStatus) => {
    try {
      await ordersApi.updateStatus(id, estado);
      setEstadoPickId(null);
      load();
    } catch (e) {
      console.error('Erro ao atualizar estado:', e);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        section="PLANEAMENTO"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Search size={14} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar..."
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterOpen(true)} activeOpacity={0.85}>
          <Text style={styles.filterBtnText} numberOfLines={1}>
            {filter === 'Todos' ? 'Estado' : (ESTADO_LABEL[filter] ?? filter).slice(0, 6) + '…'}
          </Text>
          <ChevronDown size={12} color={NAVY} />
        </TouchableOpacity>
        {canEdit && (
          <TouchableOpacity style={styles.novaBtn} onPress={() => router.push('/orders/create')} activeOpacity={0.85}>
            <Plus size={16} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} ORDENS DE PRODUÇÃO</Text>
      </View>

      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setFilterOpen(false)}>
          <View style={styles.filterMenu}>
            {FILTER_OPTS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.filterItem, opt === filter && styles.filterItemActive]}
                onPress={() => {setFilter(opt); setFilterOpen(false);}}>
                <Text style={[styles.filterItemText, opt === filter && styles.filterItemTextActive]}>
                  {opt === 'Todos' ? 'Todos' : (ESTADO_LABEL[opt] ?? opt)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />}>

        {isLoading && ordens.length === 0 && (
          <View style={styles.emptyState}><ActivityIndicator color={Colors.primary} /></View>
        )}
        {!isLoading && filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhuma ordem encontrada.</Text>
          </View>
        )}

        {filtered.map(ordem => {
          const st       = ESTADO_STYLES[ordem.status] ?? {bg: Colors.gray400};
          const label    = ESTADO_LABEL[ordem.status] ?? ordem.status;
          const prio     = PRIORIDADE_LABEL[ordem.prioridade] ?? 'Normal';
          const expanded = expandedId === ordem.id;
          const editing  = editingId === ordem.id;

          return (
            <View key={ordem.id} style={[styles.card, {borderLeftColor: st.bg}]}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpandedId(expanded ? null : ordem.id)}
                activeOpacity={0.85}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardRef}>{ordem.referencia}</Text>
                    <View style={[styles.prioChip, {backgroundColor: (PRIORIDADE_COLORS[prio] ?? Colors.gray400) + '22'}]}>
                      <Text style={[styles.prioText, {color: PRIORIDADE_COLORS[prio] ?? Colors.gray400}]}>{prio}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardNome}>{ordem.descricao}</Text>
                  <Text style={styles.cardCliente}>{ordem.cliente}</Text>
                </View>
                <View style={styles.cardHeaderRight}>
                  {canEdit ? (
                    <TouchableOpacity
                      style={[styles.estadoBadge, {backgroundColor: st.bg}]}
                      onPress={() => setEstadoPickId(ordem.id)}
                      activeOpacity={0.85}>
                      <Text style={styles.estadoText}>{label}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.estadoBadge, {backgroundColor: st.bg}]}>
                      <Text style={styles.estadoText}>{label}</Text>
                    </View>
                  )}
                  <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
                </View>
              </TouchableOpacity>

              {expanded && !editing && (
                <View style={styles.cardBody}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailField}>
                      <Text style={styles.detailLabel}>INÍCIO</Text>
                      <Text style={styles.detailValue}>{toDate(ordem.dataInicio)}</Text>
                    </View>
                    <View style={styles.detailField}>
                      <Text style={styles.detailLabel}>ENTREGA</Text>
                      <Text style={styles.detailValue}>{toDate(ordem.dataFimPrevista)}</Text>
                    </View>
                    <View style={styles.detailField}>
                      <Text style={styles.detailLabel}>RESPONSÁVEL</Text>
                      <Text style={styles.detailValue}>{ordem.responsavel || '—'}</Text>
                    </View>
                  </View>
                  {canEdit && (
                    <View style={styles.cardActions}>
                      <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(ordem)} activeOpacity={0.85}>
                        <Pencil size={12} color={NAVY} />
                        <Text style={styles.editBtnText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteId(ordem.id)} activeOpacity={0.85}>
                        <Trash2 size={12} color={Colors.danger} />
                        <Text style={styles.deleteBtnText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {expanded && editing && (
                <View style={styles.cardBody}>
                  {([
                    {label: 'NOME DA OBRA', key: 'nome',        isDate: false},
                    {label: 'RESPONSÁVEL',  key: 'responsavel', isDate: false},
                    {label: 'DATA INÍCIO',  key: 'dataInicio',  isDate: true},
                    {label: 'DATA FIM',     key: 'dataFim',     isDate: true},
                  ] as {label: string; key: string; isDate: boolean}[]).map(f => (
                    <View key={f.key} style={styles.editField}>
                      <Text style={styles.editFieldLabel}>{f.label}</Text>
                      {f.isDate ? (
                        <DateInput
                          style={styles.editInput}
                          value={(editData as any)[f.key] ?? ''}
                          onChangeText={v => setEditData(p => ({...p, [f.key]: v}))}
                        />
                      ) : (
                        <TextInput
                          style={styles.editInput}
                          value={(editData as any)[f.key] ?? ''}
                          onChangeText={v => setEditData(p => ({...p, [f.key]: v}))}
                          placeholderTextColor={Colors.gray400}
                        />
                      )}
                    </View>
                  ))}
                  <View style={styles.editActions}>
                    <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditingId(null)} activeOpacity={0.85}>
                      <X size={13} color={Colors.gray600} />
                      <Text style={styles.cancelEditText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveBtn} onPress={() => saveEdit(ordem.id)} activeOpacity={0.85}>
                      <Check size={13} color="#fff" />
                      <Text style={styles.saveBtnText}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <BottomNavBar />

      {/* Estado picker */}
      <Modal visible={!!estadoPickId} transparent animationType="fade" onRequestClose={() => setEstadoPickId(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setEstadoPickId(null)}>
          <View style={styles.estadoMenu}>
            <View style={styles.estadoMenuHeader}>
              <Text style={styles.estadoMenuTitle}>Alterar Estado</Text>
            </View>
            {DB_ESTADOS.map(opt => {
              const current = ordens.find(o => o.id === estadoPickId)?.status;
              const isActive = current === opt;
              const optSt = ESTADO_STYLES[opt] ?? {bg: Colors.gray400};
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.estadoItem, isActive && styles.estadoItemActive]}
                  onPress={() => estadoPickId && handleEstadoChange(estadoPickId, opt)}
                  activeOpacity={0.85}>
                  <View style={[styles.estadoDot, {backgroundColor: optSt.bg}]} />
                  <Text style={[styles.estadoItemText, isActive && {color: NAVY, fontFamily: 'Exo2_700Bold'}]}>
                    {ESTADO_LABEL[opt] ?? opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete confirm */}
      <Modal visible={!!deleteId} transparent animationType="fade" onRequestClose={() => setDeleteId(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setDeleteId(null)}>
          <View style={styles.confirmBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.confirmTitle}>Eliminar Ordem?</Text>
            <Text style={styles.confirmSub}>
              Tem a certeza que pretende eliminar{' '}
              <Text style={{fontFamily: 'Exo2_700Bold'}}>
                {ordens.find(o => o.id === deleteId)?.referencia}
              </Text>? Esta ação não pode ser revertida.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancelBtn} onPress={() => setDeleteId(null)} activeOpacity={0.85}>
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteBtn} onPress={confirmDelete} activeOpacity={0.85}>
                <Text style={styles.confirmDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Nova OP */}
      <Modal visible={showNova} transparent animationType="slide" onRequestClose={() => setShowNova(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowNova(false)}>
          <ScrollView style={styles.novaScroll} contentContainerStyle={styles.novaScrollContent} scrollEnabled={false}>
            <View style={styles.novaBox} onStartShouldSetResponder={() => true}>
              <View style={styles.novaHeader}>
                <Text style={styles.novaTitle}>Nova Ordem de Produção</Text>
                <TouchableOpacity onPress={() => setShowNova(false)}>
                  <X size={20} color={Colors.gray500} />
                </TouchableOpacity>
              </View>
              {([
                {label: 'NOME DA OBRA *', key: 'nome',        placeholder: 'Ex: Sinalética exterior', isDate: false},
                {label: 'RESPONSÁVEL',    key: 'responsavel', placeholder: 'Nome do responsável',      isDate: false},
                {label: 'DATA INÍCIO',    key: 'dataInicio',  placeholder: '',                         isDate: true},
                {label: 'DATA FIM PREV.', key: 'dataFim',     placeholder: '',                         isDate: true},
              ] as {label: string; key: string; placeholder: string; isDate: boolean}[]).map(f => (
                <View key={f.key} style={styles.novaField}>
                  <Text style={styles.novaLabel}>{f.label}</Text>
                  {f.isDate ? (
                    <DateInput
                      style={styles.novaInput}
                      value={(nova as any)[f.key]}
                      onChangeText={v => setNova(p => ({...p, [f.key]: v}))}
                    />
                  ) : (
                    <TextInput
                      style={styles.novaInput}
                      placeholder={f.placeholder}
                      placeholderTextColor={Colors.gray400}
                      value={(nova as any)[f.key]}
                      onChangeText={v => setNova(p => ({...p, [f.key]: v}))}
                    />
                  )}
                </View>
              ))}
              <View style={styles.novaField}>
                <Text style={styles.novaLabel}>CLIENTE *</Text>
                <TouchableOpacity
                  style={styles.novaInput}
                  onPress={() => setShowClientePicker(v => !v)}
                  activeOpacity={0.85}>
                  <Text style={{fontSize: FontSize.sm, color: clienteId ? Colors.gray900 : Colors.gray400}}>
                    {clientes.find(c => c.id === clienteId)?.nome || 'Selecionar cliente'} ▾
                  </Text>
                </TouchableOpacity>
                {showClientePicker && (
                  <View style={styles.pickerMenu}>
                    {clientes.map(c => (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.pickerMenuItem}
                        onPress={() => {setClienteId(c.id); setShowClientePicker(false);}}>
                        <Text style={styles.pickerMenuItemText}>{c.nome}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.novaField}>
                <Text style={styles.novaLabel}>PRIORIDADE</Text>
                <View style={styles.prioRow}>
                  {([['media','Média'], ['alta','Alta'], ['baixa','Normal']] as [string,string][]).map(([db, lbl]) => (
                    <TouchableOpacity
                      key={db}
                      style={[styles.prioOption, nova.prioridade === db && {borderColor: PRIORIDADE_COLORS[lbl], backgroundColor: PRIORIDADE_COLORS[lbl] + '18'}]}
                      onPress={() => setNova(p => ({...p, prioridade: db as any}))}
                      activeOpacity={0.85}>
                      <Text style={[styles.prioOptionText, nova.prioridade === db && {color: PRIORIDADE_COLORS[lbl]}]}>{lbl}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={styles.novaSaveBtn} onPress={addOrdem} activeOpacity={0.85}>
                <Text style={styles.novaSaveBtnText}>CRIAR ORDEM</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},

  toolbar: {flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm, alignItems: 'center'},
  searchBox: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 2, borderColor: NAVY, borderRadius: BorderRadius.full, backgroundColor: '#fff', paddingHorizontal: Spacing.md},
  searchInput: {flex: 1, paddingVertical: Spacing.sm, fontSize: 11, color: Colors.gray700, fontFamily: 'Exo2_400Regular'},
  filterBtn: {flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: NAVY, borderRadius: BorderRadius.full, backgroundColor: '#fff', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm},
  filterBtnText: {fontSize: 11, fontFamily: 'Exo2_700Bold', color: NAVY},
  novaBtn: {backgroundColor: GREEN, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},

  countRow: {paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm},
  countText: {fontSize: 11, fontFamily: 'Exo2_700Bold', color: Colors.gray600, letterSpacing: 1},

  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl},
  filterMenu: {backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', minWidth: 180, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8},
  filterItem: {padding: Spacing.md},
  filterItemActive: {backgroundColor: '#f0f4ff'},
  filterItemText: {fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular', color: Colors.gray700},
  filterItemTextActive: {color: NAVY, fontFamily: 'Exo2_700Bold'},

  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: Spacing.base, paddingBottom: Spacing['3xl'], gap: Spacing.sm},
  emptyState: {paddingTop: 40, alignItems: 'center'},
  emptyText: {color: Colors.gray400, fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular'},

  card: {backgroundColor: '#fff', borderRadius: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2, overflow: 'hidden'},
  cardHeader: {flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.md, gap: Spacing.sm},
  cardHeaderLeft: {flex: 1},
  cardTopRow: {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 3},
  cardRef: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, color: NAVY},
  prioChip: {paddingHorizontal: 7, paddingVertical: 2, borderRadius: BorderRadius.full},
  prioText: {fontSize: 10, fontFamily: 'Exo2_700Bold'},
  cardNome: {fontFamily: 'Exo2_600SemiBold', fontSize: 12, color: Colors.gray900, marginBottom: 2},
  cardCliente: {fontSize: 11, color: Colors.gray500, fontFamily: 'Exo2_400Regular'},
  cardHeaderRight: {alignItems: 'flex-end', gap: 6},
  estadoBadge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, maxWidth: 110},
  estadoText: {fontSize: 9, fontFamily: 'Exo2_700Bold', color: '#fff', letterSpacing: 0.3},
  chevron: {fontSize: 11, color: Colors.gray400},

  cardBody: {borderTopWidth: 1, borderTopColor: Colors.gray50, padding: Spacing.md, backgroundColor: Colors.gray50, gap: Spacing.sm},
  detailRow: {flexDirection: 'row', gap: Spacing.sm},
  detailField: {flex: 1},
  detailLabel: {fontSize: 9, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 0.5, marginBottom: 2},
  detailValue: {fontSize: 12, color: Colors.gray700, fontFamily: 'Exo2_600SemiBold'},
  cardActions: {flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.xs},
  editBtn: {flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: NAVY, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 5},
  editBtnText: {fontSize: 11, fontFamily: 'Exo2_700Bold', color: NAVY},
  deleteBtn: {flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: Colors.danger, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 5},
  deleteBtnText: {fontSize: 11, fontFamily: 'Exo2_700Bold', color: Colors.danger},

  editField: {marginBottom: Spacing.sm},
  editFieldLabel: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 1, marginBottom: 3},
  editInput: {borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, padding: Spacing.sm, fontSize: FontSize.sm, color: Colors.gray900, fontFamily: 'Exo2_400Regular', backgroundColor: '#fff'},
  editActions: {flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs},
  cancelEditBtn: {flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6},
  cancelEditText: {fontSize: 11, fontFamily: 'Exo2_700Bold', color: Colors.gray600},
  saveBtn: {flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: NAVY, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6},
  saveBtnText: {fontSize: 11, fontFamily: 'Exo2_700Bold', color: '#fff'},

  estadoMenu: {backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', minWidth: 220, shadowColor: '#000', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.18, shadowRadius: 24, elevation: 10},
  estadoMenuHeader: {padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray50},
  estadoMenuTitle: {fontSize: 12, fontFamily: 'Exo2_700Bold', color: NAVY},
  estadoItem: {flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md},
  estadoItemActive: {backgroundColor: '#f0f4ff'},
  estadoDot: {width: 8, height: 8, borderRadius: 4, flexShrink: 0},
  estadoItemText: {fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular', color: Colors.gray700},

  confirmBox: {backgroundColor: '#fff', borderRadius: 16, padding: Spacing.lg, width: '100%', shadowColor: '#000', shadowOffset: {width: 0, height: 16}, shadowOpacity: 0.2, shadowRadius: 48, elevation: 20},
  confirmTitle: {fontFamily: 'Exo2_700Bold', fontSize: 15, color: Colors.gray900, marginBottom: Spacing.sm},
  confirmSub: {fontSize: FontSize.sm, color: Colors.gray600, fontFamily: 'Exo2_400Regular', lineHeight: 20, marginBottom: Spacing.lg},
  confirmActions: {flexDirection: 'row', gap: Spacing.sm},
  confirmCancelBtn: {flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full, paddingVertical: 10, alignItems: 'center'},
  confirmCancelText: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, color: Colors.gray700},
  confirmDeleteBtn: {flex: 1, backgroundColor: Colors.danger, borderRadius: BorderRadius.full, paddingVertical: 10, alignItems: 'center'},
  confirmDeleteText: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, color: '#fff'},

  novaScroll: {flex: 1, width: '100%'},
  novaScrollContent: {flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl},
  novaBox: {backgroundColor: '#fff', borderRadius: 16, padding: Spacing.lg, width: '100%', shadowColor: '#000', shadowOffset: {width: 0, height: 16}, shadowOpacity: 0.2, shadowRadius: 48, elevation: 20},
  novaHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base},
  novaTitle: {fontFamily: 'Exo2_700Bold', fontSize: 14, color: NAVY},
  novaField: {marginBottom: Spacing.sm},
  novaLabel: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 1, marginBottom: 4},
  novaInput: {borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, padding: Spacing.sm + 2, fontSize: FontSize.sm, color: Colors.gray900, fontFamily: 'Exo2_400Regular'},
  prioRow: {flexDirection: 'row', gap: Spacing.sm},
  prioOption: {flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full, paddingVertical: 7, alignItems: 'center'},
  prioOptionText: {fontSize: 11, fontFamily: 'Exo2_700Bold', color: Colors.gray500},
  novaSaveBtn: {backgroundColor: ORANGE, borderRadius: BorderRadius.full, paddingVertical: 12, alignItems: 'center', marginTop: Spacing.sm},
  novaSaveBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1},

  pickerMenu: {backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: Colors.border, marginTop: 4, zIndex: 99, elevation: 8, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.12, shadowRadius: 6},
  pickerMenuItem: {paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm},
  pickerMenuItemText: {fontSize: FontSize.sm, color: Colors.gray700, fontFamily: 'Exo2_400Regular'},
});
