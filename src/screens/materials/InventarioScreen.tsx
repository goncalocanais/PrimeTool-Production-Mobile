import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, RefreshControl, ActivityIndicator,
} from 'react-native';
import {useRouter} from 'expo-router';
import {Search, ChevronDown, Plus, X, AlertTriangle, Package, ArrowUp} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';
import {materialsApi} from '../../api/materials';
import {Material} from '../../types';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;
const GREEN  = Colors.success;

const FILTROS = ['Todos', 'Stock baixo', 'Sem stock'];

const getStockStatus = (m: Material) => {
  if (m.stockAtual === 0)                              return {label: 'SEM STOCK',   color: Colors.danger, bg: Colors.danger + '18'};
  if (m.stockAtual <= m.stockMinimo) return {label: 'STOCK BAIXO', color: ORANGE,        bg: ORANGE        + '18'};
  return                                               {label: 'OK',           color: GREEN,         bg: GREEN         + '18'};
};

export const InventarioScreen: React.FC = () => {
  const router   = useRouter();
  const user     = useAppSelector(s => s.auth.user);
  const canManage = ['armazem', 'direcao'].includes(user?.perfil ?? '');

  const [materiais, setMateriais]   = useState<Material[]>([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [search, setSearch]         = useState('');
  const [filtro, setFiltro]         = useState('Todos');
  const [filtroOpen, setFiltroOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [showPedido, setShowPedido]       = useState(false);
  const [pedidoMat, setPedidoMat]         = useState<Material | null>(null);
  const [pedidoQty, setPedidoQty]         = useState('');
  const [pedidoMotivo, setPedidoMotivo]   = useState('');

  const [showEntrada, setShowEntrada]     = useState(false);
  const [entradaMat, setEntradaMat]       = useState<Material | null>(null);
  const [entradaQty, setEntradaQty]       = useState('');

  const [showAddMat, setShowAddMat]       = useState(false);
  const [novoMat, setNovoMat]             = useState({codigo: '', nome: '', unidade: '', stockMinimo: '', localizacao: ''});

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await materialsApi.getAll(search || undefined);
      setMateriais(data);
    } catch (e) {
      console.error('Erro ao carregar materiais:', e);
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const filtered = materiais.filter(m => {
    if (filtro === 'Sem stock')   return m.stockAtual === 0;
    if (filtro === 'Stock baixo') return m.stockAtual > 0 && m.stockAtual <= m.stockMinimo;
    return true;
  });

  const semStock   = materiais.filter(m => m.stockAtual === 0).length;
  const stockBaixo = materiais.filter(m => m.stockAtual > 0 && m.stockAtual <= m.stockMinimo).length;

  const handlePedido = () => {
    // Pedido de material deve ser feito a partir de uma OP
    setShowPedido(false);
    setPedidoMat(null);
  };

  const handleAddMaterial = async () => {
    if (!novoMat.codigo.trim() || !novoMat.nome.trim()) return;
    try {
      await materialsApi.createMaterial({
        codigo:      novoMat.codigo.trim(),
        nome:        novoMat.nome.trim(),
        unidade:     novoMat.unidade.trim() || 'un',
        stockMinimo: Number(novoMat.stockMinimo) || 0,
        localizacao: novoMat.localizacao.trim(),
      });
      setNovoMat({codigo: '', nome: '', unidade: '', stockMinimo: '', localizacao: ''});
      setShowAddMat(false);
      load();
    } catch (e) {
      console.error('Erro ao criar material:', e);
    }
  };

  const handleEntrada = async () => {
    const qty = Number(entradaQty);
    if (!entradaMat || !qty || qty <= 0) return;
    try {
      await materialsApi.registarMovimento({
        materialId: entradaMat.id,
        tipo: 'entrada',
        quantidade: qty,
        motivo: 'Entrada manual',
      });
      setEntradaQty('');
      setShowEntrada(false);
      setEntradaMat(null);
      load();
    } catch (e) {
      console.error('Erro ao registar entrada:', e);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        section="INVENTÁRIO"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      {(semStock > 0 || stockBaixo > 0) && (
        <View style={styles.alertBar}>
          {semStock > 0 && (
            <View style={styles.alertChip}>
              <AlertTriangle size={11} color={Colors.danger} />
              <Text style={[styles.alertChipText, {color: Colors.danger}]}>{semStock} SEM STOCK</Text>
            </View>
          )}
          {stockBaixo > 0 && (
            <View style={[styles.alertChip, {backgroundColor: ORANGE + '15', borderColor: ORANGE + '40'}]}>
              <AlertTriangle size={11} color={ORANGE} />
              <Text style={[styles.alertChipText, {color: ORANGE}]}>{stockBaixo} STOCK BAIXO</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Search size={14} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Código, nome ou localização..."
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {canManage && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddMat(true)} activeOpacity={0.85}>
            <Plus size={16} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.filterChip, filtro !== 'Todos' && styles.filterChipActive]}
          onPress={() => setFiltroOpen(true)}
          activeOpacity={0.85}>
          <Text style={[styles.filterChipText, filtro !== 'Todos' && styles.filterChipTextActive]}>{filtro}</Text>
          <ChevronDown size={11} color={filtro !== 'Todos' ? '#fff' : NAVY} />
        </TouchableOpacity>
        <Text style={styles.countText}>{filtered.length} materiais</Text>
      </View>

      <Modal visible={filtroOpen} transparent animationType="fade" onRequestClose={() => setFiltroOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setFiltroOpen(false)}>
          <View style={styles.filterMenu}>
            {FILTROS.map(f => (
              <TouchableOpacity key={f} style={[styles.filterMenuItem, f === filtro && styles.filterMenuItemActive]}
                onPress={() => {setFiltro(f); setFiltroOpen(false);}}>
                <Text style={[styles.filterMenuText, f === filtro && styles.filterMenuTextActive]}>{f}</Text>
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

        {isLoading && materiais.length === 0 && (
          <View style={styles.emptyState}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}

        {!isLoading && filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Package size={40} color={Colors.gray300} />
            <Text style={styles.emptyText}>Nenhum material encontrado.</Text>
          </View>
        )}

        {filtered.map(m => {
          const st       = getStockStatus(m);
          const pct      = Math.min(100, m.stockMaximo > 0 ? (m.stockAtual / m.stockMaximo) * 100 : 0);
          const expanded = expandedId === m.id;

          return (
            <View key={m.id} style={[styles.card, {borderLeftColor: st.color}]}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpandedId(expanded ? null : m.id)}
                activeOpacity={0.85}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardCodigo}>{m.codigo}</Text>
                    <View style={[styles.statusBadge, {backgroundColor: st.bg}]}>
                      <Text style={[styles.statusText, {color: st.color}]}>{st.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardNome}>{m.nome}</Text>
                  {m.categoria && <Text style={styles.cardCat}>{m.categoria}</Text>}
                  <View style={styles.stockBarBg}>
                    <View style={[styles.stockBarFill, {width: `${pct}%` as any, backgroundColor: st.color}]} />
                  </View>
                </View>
                <View style={styles.cardHeaderRight}>
                  <Text style={[styles.stockNum, {color: st.color}]}>{m.stockAtual}</Text>
                  <Text style={styles.unidade}>{m.unidade}</Text>
                  <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
                </View>
              </TouchableOpacity>

              {expanded && (
                <View style={styles.cardBody}>
                  <View style={styles.bodyRow}>
                    <View style={styles.bodyField}>
                      <Text style={styles.bodyLabel}>STOCK MÍN.</Text>
                      <Text style={styles.bodyValue}>{m.stockMinimo} {m.unidade}</Text>
                    </View>
                    <View style={styles.bodyField}>
                      <Text style={styles.bodyLabel}>STOCK MÁX.</Text>
                      <Text style={styles.bodyValue}>{m.stockMaximo} {m.unidade}</Text>
                    </View>
                    <View style={styles.bodyField}>
                      <Text style={styles.bodyLabel}>LOCALIZAÇÃO</Text>
                      <Text style={styles.bodyValue}>{m.localizacao || '—'}</Text>
                    </View>
                  </View>
                  <View style={styles.bodyRow}>
                    <View style={styles.bodyField}>
                      <Text style={styles.bodyLabel}>FORNECEDOR</Text>
                      <Text style={styles.bodyValue}>{m.fornecedor || '—'}</Text>
                    </View>
                  </View>
                  <View style={styles.actionsRow}>
                    {canManage && (
                      <TouchableOpacity
                        style={styles.entradaBtn}
                        onPress={() => {setEntradaMat(m); setEntradaQty(''); setShowEntrada(true);}}
                        activeOpacity={0.85}>
                        <ArrowUp size={13} color="#fff" strokeWidth={3} />
                        <Text style={styles.actionBtnText}>DAR ENTRADA</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.pedidoBtn}
                      onPress={() => {setPedidoMat(m); setPedidoQty(''); setPedidoMotivo(''); setShowPedido(true);}}
                      activeOpacity={0.85}>
                      <Plus size={13} color="#fff" strokeWidth={3} />
                      <Text style={styles.actionBtnText}>PEDIR MATERIAL</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <BottomNavBar />

      {/* Modal — Pedir material */}
      <Modal visible={showPedido} transparent animationType="slide" onRequestClose={() => setShowPedido(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowPedido(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pedido de Material</Text>
              <TouchableOpacity onPress={() => setShowPedido(false)}><X size={20} color={Colors.gray500} /></TouchableOpacity>
            </View>
            {pedidoMat && (
              <View style={styles.modalMatInfo}>
                <Text style={styles.modalMatCodigo}>{pedidoMat.codigo}</Text>
                <Text style={styles.modalMatNome}>{pedidoMat.nome}</Text>
                <Text style={styles.modalMatStock}>
                  Stock atual: <Text style={{color: getStockStatus(pedidoMat).color, fontFamily: 'Exo2_700Bold'}}>{pedidoMat.stockAtual} {pedidoMat.unidade}</Text>
                </Text>
              </View>
            )}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>QUANTIDADE</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: 50"
                placeholderTextColor={Colors.gray400}
                value={pedidoQty}
                onChangeText={setPedidoQty}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>MOTIVO</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Reposição de stock"
                placeholderTextColor={Colors.gray400}
                value={pedidoMotivo}
                onChangeText={setPedidoMotivo}
              />
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Para criar um pedido de material ligado a uma OP, aceda ao detalhe da ordem de produção.</Text>
            </View>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handlePedido} activeOpacity={0.85}>
              <Text style={styles.modalSaveBtnText}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal — Novo material */}
      <Modal visible={showAddMat} transparent animationType="slide" onRequestClose={() => setShowAddMat(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowAddMat(false)}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Novo Material</Text>
                <TouchableOpacity onPress={() => setShowAddMat(false)}><X size={20} color={Colors.gray500} /></TouchableOpacity>
              </View>
              {([
                {label: 'CÓDIGO *',     key: 'codigo',      placeholder: 'Ex: MP-015'},
                {label: 'DESIGNAÇÃO *', key: 'nome',        placeholder: 'Ex: Chapa Aço 3mm'},
                {label: 'UNIDADE',      key: 'unidade',     placeholder: 'Ex: un, ml, kg, lt'},
                {label: 'STOCK MÍNIMO', key: 'stockMinimo', placeholder: '0', keyboardType: 'numeric'},
                {label: 'LOCALIZAÇÃO',  key: 'localizacao', placeholder: 'Ex: A1-04'},
              ] as any[]).map((f: any) => (
                <View key={f.key} style={styles.modalField}>
                  <Text style={styles.modalLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.gray400}
                    value={(novoMat as any)[f.key]}
                    onChangeText={v => setNovoMat(p => ({...p, [f.key]: v}))}
                    keyboardType={f.keyboardType}
                  />
                </View>
              ))}
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddMaterial} activeOpacity={0.85}>
                <Text style={styles.modalSaveBtnText}>ADICIONAR MATERIAL</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Modal>

      {/* Modal — Dar entrada */}
      <Modal visible={showEntrada} transparent animationType="slide" onRequestClose={() => setShowEntrada(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowEntrada(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dar Entrada de Stock</Text>
              <TouchableOpacity onPress={() => setShowEntrada(false)}><X size={20} color={Colors.gray500} /></TouchableOpacity>
            </View>
            {entradaMat && (
              <View style={styles.modalMatInfo}>
                <Text style={styles.modalMatCodigo}>{entradaMat.codigo}</Text>
                <Text style={styles.modalMatNome}>{entradaMat.nome}</Text>
                <Text style={styles.modalMatStock}>
                  Stock atual: <Text style={{color: getStockStatus(entradaMat).color, fontFamily: 'Exo2_700Bold'}}>{entradaMat.stockAtual} {entradaMat.unidade}</Text>
                </Text>
              </View>
            )}
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>QUANTIDADE RECEBIDA</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: 30"
                placeholderTextColor={Colors.gray400}
                value={entradaQty}
                onChangeText={setEntradaQty}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={[styles.modalSaveBtn, {backgroundColor: GREEN}]}
              onPress={handleEntrada}
              activeOpacity={0.85}>
              <Text style={styles.modalSaveBtnText}>CONFIRMAR ENTRADA</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},

  alertBar: {flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: Colors.border},
  alertChip: {flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.danger + '15', borderWidth: 1, borderColor: Colors.danger + '40', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 4},
  alertChipText: {fontSize: 10, fontFamily: 'Exo2_700Bold', letterSpacing: 0.5},

  toolbar: {flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm, alignItems: 'center'},
  searchBox: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 2, borderColor: NAVY, borderRadius: BorderRadius.full, backgroundColor: '#fff', paddingHorizontal: Spacing.md},
  searchInput: {flex: 1, paddingVertical: Spacing.sm, fontSize: 11, color: Colors.gray700, fontFamily: 'Exo2_400Regular'},
  addBtn: {backgroundColor: GREEN, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},

  filtersRow: {flexDirection: 'row', paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: Spacing.sm, alignItems: 'center'},
  filterChip: {flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: NAVY, borderRadius: BorderRadius.full, backgroundColor: '#fff', paddingHorizontal: Spacing.md, paddingVertical: 5},
  filterChipActive: {backgroundColor: NAVY, borderColor: NAVY},
  filterChipText: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: NAVY},
  filterChipTextActive: {color: '#fff'},
  countText: {flex: 1, textAlign: 'right', fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray500, letterSpacing: 0.5},

  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl},
  filterMenu: {backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', minWidth: 200, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8},
  filterMenuItem: {padding: Spacing.md},
  filterMenuItemActive: {backgroundColor: '#f0f4ff'},
  filterMenuText: {fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular', color: Colors.gray700},
  filterMenuTextActive: {color: NAVY, fontFamily: 'Exo2_700Bold'},

  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: Spacing.base, paddingBottom: Spacing['3xl'], gap: Spacing.sm},
  emptyState: {paddingTop: 60, alignItems: 'center', gap: Spacing.md},
  emptyText: {color: Colors.gray400, fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular'},

  card: {backgroundColor: '#fff', borderRadius: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2, overflow: 'hidden'},
  cardHeader: {flexDirection: 'row', alignItems: 'flex-start', padding: Spacing.md, gap: Spacing.sm},
  cardHeaderLeft: {flex: 1, gap: 3},
  cardTopRow: {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm},
  cardCodigo: {fontFamily: 'Exo2_700Bold', fontSize: 11, color: Colors.primaryLight},
  statusBadge: {paddingHorizontal: 7, paddingVertical: 2, borderRadius: BorderRadius.full},
  statusText: {fontSize: 9, fontFamily: 'Exo2_700Bold', letterSpacing: 0.3},
  cardNome: {fontFamily: 'Exo2_600SemiBold', fontSize: FontSize.sm, color: Colors.gray900},
  cardCat: {fontSize: 10, color: Colors.gray400, fontFamily: 'Exo2_400Regular'},
  stockBarBg: {height: 4, backgroundColor: Colors.gray100, borderRadius: 2, overflow: 'hidden', marginTop: 4},
  stockBarFill: {height: 4, borderRadius: 2},
  cardHeaderRight: {alignItems: 'center', gap: 2},
  stockNum: {fontFamily: 'Exo2_700Bold', fontSize: 20},
  unidade: {fontSize: 10, color: Colors.gray400, fontFamily: 'Exo2_400Regular'},
  chevron: {fontSize: 11, color: Colors.gray400, marginTop: 4},

  cardBody: {borderTopWidth: 1, borderTopColor: Colors.gray50, padding: Spacing.md, backgroundColor: Colors.gray50, gap: Spacing.sm},
  bodyRow: {flexDirection: 'row', gap: Spacing.md},
  bodyField: {flex: 1},
  bodyLabel: {fontSize: 9, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 0.5, marginBottom: 2},
  bodyValue: {fontSize: 12, color: Colors.gray700, fontFamily: 'Exo2_600SemiBold'},

  actionsRow: {flexDirection: 'row', gap: Spacing.sm, marginTop: 4},
  entradaBtn: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: GREEN, borderRadius: BorderRadius.full, paddingVertical: 9},
  pedidoBtn:  {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: NAVY, borderRadius: BorderRadius.full, paddingVertical: 9},
  actionBtnText: {fontSize: 11, fontFamily: 'Exo2_700Bold', color: '#fff', letterSpacing: 0.5},

  modalBox: {backgroundColor: '#fff', borderRadius: 16, padding: Spacing.lg, width: '100%', shadowColor: '#000', shadowOffset: {width: 0, height: 16}, shadowOpacity: 0.2, shadowRadius: 48, elevation: 20},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base},
  modalTitle: {fontFamily: 'Exo2_700Bold', fontSize: 14, color: NAVY},
  modalMatInfo: {backgroundColor: Colors.gray50, borderRadius: 8, padding: Spacing.md, marginBottom: Spacing.md},
  modalMatCodigo: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.primaryLight, letterSpacing: 0.5},
  modalMatNome: {fontSize: FontSize.sm, fontFamily: 'Exo2_700Bold', color: Colors.gray900, marginVertical: 2},
  modalMatStock: {fontSize: 11, color: Colors.gray500, fontFamily: 'Exo2_400Regular'},
  modalField: {marginBottom: Spacing.sm},
  modalLabel: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 1, marginBottom: 4},
  modalInput: {borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, padding: Spacing.sm + 2, fontSize: FontSize.sm, color: Colors.gray900, fontFamily: 'Exo2_400Regular'},
  modalSaveBtn: {backgroundColor: ORANGE, borderRadius: BorderRadius.full, paddingVertical: 12, alignItems: 'center', marginTop: Spacing.sm},
  modalSaveBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1},
  modalScroll: {flex: 1, width: '100%'},
  modalScrollContent: {flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl},

  infoBox: {backgroundColor: Colors.primaryUltraLight, borderRadius: 8, padding: Spacing.md, marginBottom: Spacing.sm},
  infoText: {fontSize: 11, color: Colors.primaryLight, fontFamily: 'Exo2_400Regular', lineHeight: 16},
});
