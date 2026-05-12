import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, RefreshControl, ActivityIndicator} from 'react-native';
import {useRouter} from 'expo-router';
import {Search, ChevronDown, Plus, X} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';
import {qualityApi} from '../../api/quality';
import {InspeccaoQualidade} from '../../types';
import {supabase} from '../../lib/supabase';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;
const GREEN  = Colors.success;

const RESULTADO_LABEL: Record<string, string> = {
  aprovado:               'Aprovado',
  reprovado:              'Reprovado',
  aprovado_com_ressalvas: 'Com Ressalvas',
};

const RESULTADO_STYLES: Record<string, {bg: string}> = {
  aprovado:               {bg: GREEN},
  reprovado:              {bg: Colors.danger},
  aprovado_com_ressalvas: {bg: ORANGE},
};

const FILTER_OPTS = ['Todos', 'Aprovado', 'Reprovado', 'Com Ressalvas'];

export const VerificacoesScreen: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);
  const canEdit = ['qualidade', 'direcao'].includes(user?.perfil ?? '');
  const [verificacoes, setVerificacoes] = useState<InspeccaoQualidade[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('Todos');
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showNova, setShowNova] = useState(false);
  const [nova, setNova] = useState({ordemRef: '', tipo: '', observacoes: '', resultado: 'aprovado'});

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await qualityApi.getInspeccoes();
      setVerificacoes(data);
    } catch (e) {
      console.error('Erro ao carregar verificações:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = verificacoes.filter(v => {
    const displayResultado = RESULTADO_LABEL[v.resultado ?? ''] ?? '';
    const matchFilter = filter === 'Todos' || displayResultado === filter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || v.referencia.toLowerCase().includes(q)
      || (v.ordemProducao?.referencia ?? '').toLowerCase().includes(q)
      || v.inspector.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const handleAdd = async () => {
    if (!nova.ordemRef.trim()) return;
    try {
      const {data: orderData} = await supabase
        .from('producao_ordemproducao')
        .select('id')
        .eq('referencia', nova.ordemRef.trim())
        .single();
      const tipoDb = nova.tipo.toLowerCase().includes('interm') ? 'intermedia' : 'final';
      await qualityApi.create({
        ordemProducaoId: orderData?.id,
        tipo: tipoDb as any,
        resultado: nova.resultado as any,
        observacoes: nova.observacoes || undefined,
      });
      setNova({ordemRef: '', tipo: '', observacoes: '', resultado: 'aprovado'});
      setShowNova(false);
      load();
    } catch (e) {
      console.error('Erro ao criar verificação:', e);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        section="QUALIDADE"

        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/quality')}>
          <Text style={styles.breadcrumbLink}>QUALIDADE</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}> › </Text>
        <Text style={styles.breadcrumbCurrent}>CONSULTAR VERIFICAÇÕES</Text>
      </View>

      {/* Toolbar */}
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
          <Text style={styles.filterBtnText}>{filter === 'Todos' ? 'Estado' : filter.slice(0, 6) + '…'}</Text>
          <ChevronDown size={12} color={NAVY} />
        </TouchableOpacity>
        {canEdit && (
          <TouchableOpacity style={styles.novaBtn} onPress={() => setShowNova(true)} activeOpacity={0.85}>
            <Plus size={16} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} VERIFICAÇÕES</Text>
      </View>

      {/* Filter modal */}
      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setFilterOpen(false)}>
          <View style={styles.filterMenu}>
            {FILTER_OPTS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.filterItem, opt === filter && styles.filterItemActive]}
                onPress={() => {setFilter(opt); setFilterOpen(false);}}>
                <Text style={[styles.filterItemText, opt === filter && styles.filterItemTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />}>

        {isLoading && verificacoes.length === 0 && (
          <View style={{paddingTop: 40, alignItems: 'center'}}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
        {!isLoading && filtered.length === 0 && (
          <View style={styles.emptyState}><Text style={styles.emptyText}>Nenhuma verificação encontrada.</Text></View>
        )}
        {filtered.map(v => {
          const st = RESULTADO_STYLES[v.resultado ?? ''] ?? {bg: Colors.gray400};
          const displayResultado = RESULTADO_LABEL[v.resultado ?? ''] ?? v.resultado ?? '—';
          const expanded = expandedId === v.id;
          return (
            <View key={v.id} style={[styles.card, {borderLeftColor: st.bg}]}>
              <TouchableOpacity style={styles.cardHeader} onPress={() => setExpandedId(expanded ? null : v.id)} activeOpacity={0.85}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardRef}>{v.referencia}</Text>
                  <Text style={styles.cardSub}>OP {v.ordemProducao?.referencia ?? '—'} · {v.tipo}</Text>
                  <Text style={styles.cardInspector}>{v.inspector}</Text>
                </View>
                <View style={styles.cardHeaderRight}>
                  <View style={[styles.badge, {backgroundColor: st.bg}]}>
                    <Text style={styles.badgeText}>{displayResultado}</Text>
                  </View>
                  <Text style={styles.cardDate}>{(v.dataInspeccao ?? '').split('T')[0].split('-').reverse().join('/')}</Text>
                  <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
                </View>
              </TouchableOpacity>
              {expanded && (
                <View style={styles.cardBody}>
                  <Text style={styles.bodyLabel}>OBSERVAÇÕES</Text>
                  <Text style={styles.bodyValue}>{v.observacoes || 'Sem observações.'}</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <BottomNavBar />

      {/* Nova verificação modal */}
      <Modal visible={canEdit && showNova} transparent animationType="slide" onRequestClose={() => setShowNova(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowNova(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registar Verificação</Text>
              <TouchableOpacity onPress={() => setShowNova(false)}><X size={20} color={Colors.gray500} /></TouchableOpacity>
            </View>
            {([
              {label: 'REFERÊNCIA DA OP *', key: 'ordemRef',    placeholder: '2026-0001'},
              {label: 'TIPO DE INSPEÇÃO',   key: 'tipo',         placeholder: 'Ex: Inspeção Final'},
              {label: 'OBSERVAÇÕES',        key: 'observacoes',  placeholder: 'Observações...'},
            ] as {label: string; key: string; placeholder: string}[]).map(f => (
              <View key={f.key} style={styles.modalField}>
                <Text style={styles.modalLabel}>{f.label}</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.gray400}
                  value={(nova as any)[f.key]}
                  onChangeText={v => setNova(p => ({...p, [f.key]: v}))}
                  multiline={f.key === 'observacoes'}
                />
              </View>
            ))}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>RESULTADO</Text>
              <View style={styles.resultRow}>
                {(['aprovado', 'aprovado_com_ressalvas', 'reprovado'] as string[]).map(r => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.resultOption, nova.resultado === r && {backgroundColor: RESULTADO_STYLES[r].bg, borderColor: RESULTADO_STYLES[r].bg}]}
                    onPress={() => setNova(p => ({...p, resultado: r}))}
                    activeOpacity={0.85}>
                    <Text style={[styles.resultOptionText, nova.resultado === r && {color: '#fff'}]}>{RESULTADO_LABEL[r]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAdd} activeOpacity={0.85}>
              <Text style={styles.modalSaveBtnText}>REGISTAR</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},

  breadcrumb: {backgroundColor: ORANGE, paddingHorizontal: Spacing.base, paddingVertical: 7, flexDirection: 'row', alignItems: 'center'},
  breadcrumbLink: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 11, letterSpacing: 1, opacity: 0.85},
  breadcrumbSep:  {color: 'rgba(255,255,255,0.6)', fontSize: 11, marginHorizontal: 4},
  breadcrumbCurrent: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 11, letterSpacing: 1},

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
  cardHeaderLeft: {flex: 1},
  cardRef: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, color: NAVY},
  cardSub: {fontSize: 11, color: Colors.gray600, fontFamily: 'Exo2_400Regular', marginTop: 2},
  cardInspector: {fontSize: 11, color: Colors.gray400, fontFamily: 'Exo2_400Regular', marginTop: 1},
  cardHeaderRight: {alignItems: 'flex-end', gap: 4},
  badge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full},
  badgeText: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: '#fff'},
  cardDate: {fontSize: 10, color: Colors.gray400, fontFamily: 'Exo2_400Regular'},
  chevron: {fontSize: 11, color: Colors.gray400},
  cardBody: {borderTopWidth: 1, borderTopColor: Colors.gray50, padding: Spacing.md, backgroundColor: Colors.gray50},
  bodyLabel: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 0.5, marginBottom: 4},
  bodyValue: {fontSize: FontSize.sm, color: Colors.gray700, fontFamily: 'Exo2_400Regular', lineHeight: 18},

  modalBox: {backgroundColor: '#fff', borderRadius: 16, padding: Spacing.lg, width: '100%', shadowColor: '#000', shadowOffset: {width: 0, height: 16}, shadowOpacity: 0.2, shadowRadius: 48, elevation: 20},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base},
  modalTitle: {fontFamily: 'Exo2_700Bold', fontSize: 14, color: NAVY},
  modalField: {marginBottom: Spacing.sm},
  modalLabel: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 1, marginBottom: 4},
  modalInput: {borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, padding: Spacing.sm + 2, fontSize: FontSize.sm, color: Colors.gray900, fontFamily: 'Exo2_400Regular'},
  resultRow: {flexDirection: 'row', gap: Spacing.sm},
  resultOption: {flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full, paddingVertical: 7, alignItems: 'center'},
  resultOptionText: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray500},
  modalSaveBtn: {backgroundColor: ORANGE, borderRadius: BorderRadius.full, paddingVertical: 12, alignItems: 'center', marginTop: Spacing.sm},
  modalSaveBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1},
});
