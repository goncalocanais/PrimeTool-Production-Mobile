import React, {useState, useCallback, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, FlatList, RefreshControl, ActivityIndicator, Keyboard} from 'react-native';
import {useRouter} from 'expo-router';
import {Search, ChevronDown, Plus, X} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar, DateInput} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';
import {expeditionApi} from '../../api/expedition';
import {ordersApi} from '../../api/orders';
import {Expedicao} from '../../types';

const NAVY  = Colors.primary;
const ORANGE = Colors.warning;
const GREEN  = Colors.success;

const ESTADO_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  enviado:  'Enviado',
  entregue: 'Entregue',
  cancelado:'Cancelado',
};
const ESTADO_STYLES: Record<string, string> = {
  pendente:  ORANGE,
  enviado:   '#3b82f6',
  entregue:  GREEN,
  cancelado: Colors.danger,
};
const FILTER_OPTS = ['Todos', 'Pendente', 'Enviado', 'Entregue'];

const toDate = (s?: string) => {
  if (!s) return '—';
  if (s.includes('/')) return s;
  const [y, m, d] = s.split('T')[0].split('-');
  return d && m && y ? `${d}/${m}/${y}` : '—';
};

export const ExpedicoesListScreen: React.FC = () => {
  const router = useRouter();
  const user   = useAppSelector(s => s.auth.user);
  const canEdit = ['expedicao', 'direcao'].includes(user?.perfil ?? '');

  const [expedicoes, setExpedicoes]     = useState<Expedicao[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [search, setSearch]             = useState('');
  const [filter, setFilter]             = useState('Todos');
  const [filterOpen, setFilterOpen]     = useState(false);
  const [expandedId, setExpandedId]     = useState<number | null>(null);
  const [showNova, setShowNova]         = useState(false);
  const [opsExpedicao, setOpsExpedicao] = useState<{id: number; referencia: string; descricao: string}[]>([]);
  const [selectedOpId, setSelectedOpId] = useState<number | null>(null);
  const [showOpPicker, setShowOpPicker] = useState(false);
  const [nova, setNova] = useState({morada: '', transportadora: '', dataPrevisao: '', observacoes: ''});

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    try { setExpedicoes(await expeditionApi.getAll()); }
    catch (e) { console.error('Erro ao carregar expedições:', e); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = expedicoes.filter(e => {
    const displayEstado = ESTADO_LABEL[e.status ?? ''] ?? '';
    const matchFilter = filter === 'Todos' || displayEstado === filter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || (e.referencia ?? '').toLowerCase().includes(q)
      || (e.destinatario ?? '').toLowerCase().includes(q)
      || (e.ordemProducao?.referencia ?? '').toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const openNova = async () => {
    try {
      const all = await ordersApi.getAll();
      const ops = all.filter(o => o.status === 'expedicao');
      console.log('[Expedicao] total OPs:', all.length, '| em expedicao:', ops.length, '| statuses:', all.map(o => o.status));
      setOpsExpedicao(ops.map(o => ({id: o.id, referencia: o.referencia, descricao: o.descricao})));
      if (ops.length > 0) setSelectedOpId(ops[0].id);
    } catch (e) { console.error('[Expedicao] openNova error:', e); }
    setShowNova(true);
  };

  const handleAdd = async () => {
    if (!selectedOpId || !nova.morada.trim()) return;
    Keyboard.dismiss();
    try {
      await expeditionApi.create({
        ordemProducaoId: selectedOpId,
        moradaEntrega: nova.morada,
        transportadora: nova.transportadora || undefined,
        dataPrevisaoEntrega: nova.dataPrevisao || undefined,
        observacoes: nova.observacoes || undefined,
        status: 'pendente',
      });
      setNova({morada: '', transportadora: '', dataPrevisao: '', observacoes: ''});
      setSelectedOpId(null);
      setShowOpPicker(false);
      setShowNova(false);
      load();
    } catch (e) { console.error('Erro ao criar expedição:', e); }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        section="EXPEDIÇÃO"
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
          <Text style={styles.filterBtnText}>{filter === 'Todos' ? 'Estado' : filter.slice(0,5) + '…'}</Text>
          <ChevronDown size={12} color={NAVY} />
        </TouchableOpacity>
        {canEdit && (
          <TouchableOpacity style={styles.novaBtn} onPress={openNova} activeOpacity={0.85}>
            <Plus size={16} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} EXPEDIÇÕES</Text>
      </View>

      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setFilterOpen(false)}>
          <View style={styles.filterMenu}>
            {FILTER_OPTS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.filterItem, opt === filter && styles.filterItemActive]}
                onPress={() => { setFilter(opt); setFilterOpen(false); }}>
                <Text style={[styles.filterItemText, opt === filter && styles.filterItemTextActive]}>{opt}</Text>
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

        {isLoading && expedicoes.length === 0 && (
          <View style={styles.emptyState}><ActivityIndicator color={Colors.primary} /></View>
        )}
        {!isLoading && filtered.length === 0 && (
          <View style={styles.emptyState}><Text style={styles.emptyText}>Nenhuma expedição encontrada.</Text></View>
        )}

        {filtered.map(exp => {
          const cor     = ESTADO_STYLES[exp.status ?? ''] ?? Colors.gray400;
          const label   = ESTADO_LABEL[exp.status ?? ''] ?? exp.status ?? '—';
          const expanded = expandedId === exp.id;
          return (
            <View key={exp.id} style={[styles.card, {borderLeftColor: cor}]}>
              <TouchableOpacity style={styles.cardHeader} onPress={() => setExpandedId(expanded ? null : exp.id)} activeOpacity={0.85}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardRef}>{exp.referencia}</Text>
                  <Text style={styles.cardDest}>{exp.destinatario}</Text>
                  {exp.ordemProducao && (
                    <Text style={styles.cardOp}>OP {exp.ordemProducao.referencia}</Text>
                  )}
                </View>
                <View style={styles.cardRight}>
                  <View style={[styles.badge, {backgroundColor: cor}]}>
                    <Text style={styles.badgeText}>{label}</Text>
                  </View>
                  {exp.dataPrevisaoEntrega && (
                    <Text style={styles.cardDate}>{toDate(exp.dataPrevisaoEntrega)}</Text>
                  )}
                  <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
                </View>
              </TouchableOpacity>
              {expanded && (
                <View style={styles.cardBody}>
                  <Text style={styles.bodyLabel}>MORADA</Text>
                  <Text style={styles.bodyValue}>{exp.moradaEntrega || '—'}</Text>
                  {exp.transportadora && <>
                    <Text style={[styles.bodyLabel, {marginTop: Spacing.sm}]}>TRANSPORTADORA</Text>
                    <Text style={styles.bodyValue}>{exp.transportadora}</Text>
                  </>}
                  {exp.guiaTransporte && <>
                    <Text style={[styles.bodyLabel, {marginTop: Spacing.sm}]}>GUIA DE TRANSPORTE</Text>
                    <Text style={styles.bodyValue}>{exp.guiaTransporte}</Text>
                  </>}
                  {exp.observacoes && <>
                    <Text style={[styles.bodyLabel, {marginTop: Spacing.sm}]}>OBSERVAÇÕES</Text>
                    <Text style={styles.bodyValue}>{exp.observacoes}</Text>
                  </>}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <BottomNavBar />

      {/* OP picker */}
      <Modal visible={showOpPicker} transparent animationType="fade" onRequestClose={() => setShowOpPicker(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowOpPicker(false)}>
          <View style={[styles.filterMenu, {minWidth: 280, maxHeight: 350}]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.filterItemText, {padding: Spacing.md, fontFamily: 'Exo2_700Bold', color: NAVY}]}>OPs prontas para expedição</Text>
            <FlatList
              data={opsExpedicao}
              keyExtractor={o => String(o.id)}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[styles.filterItem, item.id === selectedOpId && styles.filterItemActive]}
                  onPress={() => { setSelectedOpId(item.id); setShowOpPicker(false); }}>
                  <Text style={[styles.filterItemText, item.id === selectedOpId && styles.filterItemTextActive]}>{item.referencia}</Text>
                  <Text style={{fontSize: 10, color: Colors.gray400, fontFamily: 'Exo2_400Regular'}}>{item.descricao}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Nova expedição modal */}
      <Modal visible={canEdit && showNova} transparent animationType="slide" hardwareAccelerated onRequestClose={() => { Keyboard.dismiss(); setShowNova(false); }}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Guia de Transporte</Text>
              <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowNova(false); }}>
                <X size={20} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>ORDEM DE PRODUÇÃO *</Text>
              {opsExpedicao.length === 0 ? (
                <View style={styles.emptyOps}>
                  <Text style={styles.emptyOpsText}>Nenhuma OP pronta para expedição.</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.modalInput} onPress={() => setShowOpPicker(true)} activeOpacity={0.85}>
                    <Text style={{fontSize: FontSize.sm, color: selectedOpId ? Colors.gray900 : Colors.gray400}}>
                      {opsExpedicao.find(o => o.id === selectedOpId)?.referencia || 'Selecionar OP'} ▾
                    </Text>
                  </TouchableOpacity>
                  {selectedOpId && (
                    <Text style={styles.opDescricao}>{opsExpedicao.find(o => o.id === selectedOpId)?.descricao}</Text>
                  )}
                </>
              )}
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>MORADA DE ENTREGA *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Rua, cidade, código postal..."
                placeholderTextColor={Colors.gray400}
                value={nova.morada}
                onChangeText={v => setNova(p => ({...p, morada: v}))}
                multiline
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>TRANSPORTADORA</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: DHL, CTT..."
                placeholderTextColor={Colors.gray400}
                value={nova.transportadora}
                onChangeText={v => setNova(p => ({...p, transportadora: v}))}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>DATA PREVISÃO ENTREGA</Text>
              <DateInput
                style={styles.modalInput}
                value={nova.dataPrevisao}
                onChangeText={v => setNova(p => ({...p, dataPrevisao: v}))}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>OBSERVAÇÕES</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Notas adicionais..."
                placeholderTextColor={Colors.gray400}
                value={nova.observacoes}
                onChangeText={v => setNova(p => ({...p, observacoes: v}))}
                multiline
              />
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAdd} activeOpacity={0.85}>
              <Text style={styles.modalSaveBtnText}>CRIAR GUIA DE TRANSPORTE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},

  toolbar: {flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm, alignItems: 'center'},
  searchBox: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full, backgroundColor: '#fff', paddingHorizontal: Spacing.md},
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
  cardHeader: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: Spacing.md},
  cardLeft: {flex: 1},
  cardRef: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, color: NAVY},
  cardDest: {fontSize: 12, color: Colors.gray700, fontFamily: 'Exo2_600SemiBold', marginTop: 2},
  cardOp: {fontSize: 11, color: Colors.gray400, fontFamily: 'Exo2_400Regular', marginTop: 1},
  cardRight: {alignItems: 'flex-end', gap: 4},
  badge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full},
  badgeText: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: '#fff'},
  cardDate: {fontSize: 10, color: Colors.gray400, fontFamily: 'Exo2_400Regular'},
  chevron: {fontSize: 11, color: Colors.gray400},
  cardBody: {borderTopWidth: 1, borderTopColor: Colors.gray50, padding: Spacing.md, backgroundColor: Colors.gray50},
  bodyLabel: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 0.5, marginBottom: 2},
  bodyValue: {fontSize: FontSize.sm, color: Colors.gray700, fontFamily: 'Exo2_400Regular', lineHeight: 18},

  modalBox: {backgroundColor: '#fff', borderRadius: 16, padding: Spacing.lg, width: '100%', maxHeight: '90%', shadowColor: '#000', shadowOffset: {width: 0, height: 16}, shadowOpacity: 0.2, shadowRadius: 48, elevation: 20},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base},
  modalTitle: {fontFamily: 'Exo2_700Bold', fontSize: 14, color: NAVY},
  modalField: {marginBottom: Spacing.sm},
  modalLabel: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 1, marginBottom: 4},
  modalInput: {borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, padding: Spacing.sm + 2, fontSize: FontSize.sm, color: Colors.gray900, fontFamily: 'Exo2_400Regular'},
  modalSaveBtn: {backgroundColor: ORANGE, borderRadius: BorderRadius.full, paddingVertical: 12, alignItems: 'center', marginTop: Spacing.sm},
  modalSaveBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1},
  emptyOps: {padding: Spacing.md, backgroundColor: Colors.gray50, borderRadius: 8, borderWidth: 1, borderColor: Colors.border},
  emptyOpsText: {fontSize: FontSize.sm, color: Colors.gray500, fontFamily: 'Exo2_400Regular', textAlign: 'center'},
  opDescricao: {fontSize: 11, color: Colors.gray500, fontFamily: 'Exo2_400Regular', marginTop: 4, paddingLeft: 2},
});
