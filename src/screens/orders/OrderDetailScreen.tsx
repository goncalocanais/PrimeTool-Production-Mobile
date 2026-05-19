import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, RefreshControl,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {Play, Pause, Square, Plus, Clock, Package, History, Info, ClipboardList, CheckCircle} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';
import {ordersApi} from '../../api/orders';
import {notificacoesApi} from '../../api/notificacoes';
import {materialsApi} from '../../api/materials';
import {OrdemProducao, RegistoProgresso} from '../../types';
import {supabase} from '../../lib/supabase';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;

const ESTADO_LABEL: Record<string, string> = {
  planeamento: 'EM PLANEAMENTO',
  em_producao: 'EM PRODUÇÃO',
  montagem:    'EM MONTAGEM',
  expedicao:   'EM EXPEDIÇÃO',
  qualidade:   'EM QUALIDADE',
  concluida:   'CONCLUÍDA',
  cancelada:   'CANCELADA',
};

const ESTADO_BADGE: Record<string, {bg: string; color: string}> = {
  planeamento: {bg: Colors.gray600,  color: '#fff'},
  em_producao: {bg: '#3b82f6',       color: '#fff'},
  montagem:    {bg: ORANGE,          color: '#fff'},
  expedicao:   {bg: '#8b5cf6',       color: '#fff'},
  qualidade:   {bg: Colors.success,  color: '#fff'},
  concluida:   {bg: Colors.success,  color: '#fff'},
  cancelada:   {bg: Colors.danger,   color: '#fff'},
  pausada:     {bg: ORANGE,          color: '#fff'},
};

interface PedidoMaterial    { id: number; descricao: string; quantidade: number; estado: string; pedidoEm: string; }
interface MaterialNecessario { id: number; descricao: string; quantidade: number; }

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT') + ' ' + d.toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'});
}

function SectionHeader({icon, title, action}: {icon: React.ReactNode; title: string; action?: React.ReactNode}) {
  return (
    <View style={secStyles.header}>
      <View style={secStyles.left}>{icon}<Text style={secStyles.title}>{title}</Text></View>
      {action}
    </View>
  );
}
const secStyles = StyleSheet.create({
  header: {backgroundColor: NAVY, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderTopLeftRadius: 12, borderTopRightRadius: 12},
  left: {flexDirection: 'row', alignItems: 'center', gap: 8},
  title: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 11, letterSpacing: 1.5},
});

export const OrderDetailScreen: React.FC = () => {
  const {id} = useLocalSearchParams<{id: string}>();
  const numId = parseInt(id ?? '0');
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);
  const role = user?.perfil ?? 'producao';

  const [ordem, setOrdem]             = useState<OrdemProducao | null>(null);
  const [historico, setHistorico]     = useState<RegistoProgresso[]>([]);
  const [pedidos, setPedidos]             = useState<PedidoMaterial[]>([]);
  const [necessarios, setNecessarios]     = useState<MaterialNecessario[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [isPaused, setIsPaused]       = useState(false);
  const [timerSecs, setTimerSecs]     = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerDone, setTimerDone]     = useState(false);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [novoMat, setNovoMat]         = useState({descricao: '', qty: '', valid: false});
  const [matSuggestions, setMatSuggestions] = useState<string[]>([]);
  const [matStockError, setMatStockError] = useState('');
  const suggTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notification, setNotification] = useState('');

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const load = useCallback(async () => {
    if (!numId) return;
    setIsLoading(true);
    try {
      const [ordemData, historicoData] = await Promise.all([
        ordersApi.getById(numId),
        ordersApi.getProgressHistory(numId),
      ]);
      setOrdem(ordemData);
      setHistorico(historicoData);

      const pedRes = await supabase
        .from('producao_pedidomaterialadicional')
        .select('id, descricao_material, quantidade, estado, observacoes, pedido_em')
        .eq('ordem_id', numId)
        .order('pedido_em', {ascending: false});

      const allPedidos = pedRes.data ?? [];
      setNecessarios(allPedidos
        .filter((r: any) => r.observacoes === 'planeamento')
        .map((r: any) => ({id: r.id, descricao: r.descricao_material, quantidade: r.quantidade})));
      setPedidos(allPedidos
        .filter((r: any) => r.observacoes !== 'planeamento')
        .map((r: any) => ({
          id: r.id,
          descricao: r.descricao_material,
          quantidade: r.quantidade,
          estado: r.estado,
          pedidoEm: r.pedido_em,
        })));
    } catch (e) {
      console.error('Erro ao carregar ordem:', e);
    } finally {
      setIsLoading(false);
    }
  }, [numId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setTimerSecs(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  function showNotif(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  }

  const handleMatDescricaoChange = (text: string) => {
    setNovoMat(d => ({...d, descricao: text, valid: false}));
    if (suggTimeout.current) clearTimeout(suggTimeout.current);
    if (text.length >= 2) {
      suggTimeout.current = setTimeout(async () => {
        try {
          const results = await materialsApi.getAll(text);
          setMatSuggestions(results.map(r => r.nome));
        } catch { setMatSuggestions([]); }
      }, 250);
    } else {
      setMatSuggestions([]);
    }
  };

  const selectMatSuggestion = (nome: string) => {
    setNovoMat(d => ({...d, descricao: nome, valid: true}));
    setMatSuggestions([]);
  };

  const closeAddMaterial = () => {
    setShowAddMaterial(false);
    setNovoMat({descricao: '', qty: '', valid: false});
    setMatSuggestions([]);
    setMatStockError('');
  };

  async function handleIniciar() {
    if (!ordem) return;
    try {
      await ordersApi.updateStatus(numId, 'em_producao');
      await ordersApi.updateProgress(numId, 0, 'Produção iniciada.');
      setTimerActive(true);
      setIsPaused(false);
      showNotif('Produção iniciada.');
      load();
    } catch (e) { console.error(e); }
  }

  async function handlePausar() {
    const pausing = !isPaused;
    setIsPaused(pausing);
    setTimerActive(!pausing);
    const msg = pausing ? 'Produção pausada.' : 'Produção retomada.';
    try {
      await ordersApi.updateProgress(numId, 0, msg);
      showNotif(msg);
      const hist = await ordersApi.getProgressHistory(numId);
      setHistorico(hist);
    } catch (e) { console.error(e); }
  }

  async function handleTerminar() {
    setTimerActive(false);
    setIsPaused(false);
    setTimerDone(true);
    try {
      await ordersApi.updateStatus(numId, 'qualidade');
      await ordersApi.updateProgress(numId, 0, 'Produção concluída. Enviado para controlo de qualidade.');
      showNotif('Produção concluída! OP enviada para controlo de qualidade.');
      load();
    } catch (e) { console.error(e); }
  }

  async function handleAddMaterial() {
    if (!novoMat.descricao.trim() || !novoMat.valid) return;
    const qty = parseFloat(novoMat.qty) || 1;
    try {
      // Verificar stock ANTES de registar
      setMatStockError('');
      const stock = await materialsApi.getStockByName(novoMat.descricao);
      if (stock.materialId !== null && stock.available < qty) {
        notificacoesApi.create(
          'armazem',
          'Reposição de stock necessária',
          `OP ${ordem?.referencia}: ${novoMat.descricao} — pedido ${qty}, disponível ${stock.available}. Repor stock.`,
          numId,
        ).catch(() => {});
        setMatStockError(`Stock insuficiente: só há ${stock.available} unidade(s) de ${novoMat.descricao} em armazém.\n\nO armazém foi notificado para repor o stock. Tenta novamente após a reposição.`);
        return;
      }

      await supabase.from('producao_pedidomaterialadicional').insert({
        descricao_material: novoMat.descricao,
        quantidade: qty,
        unidade: 'un',
        justificacao: '',
        observacoes: '',
        estado: 'pendente',
        ordem_id: numId,
        pedido_em: new Date().toISOString(),
      });
      await ordersApi.updateProgress(numId, 0, `Material adicional pedido: ${novoMat.descricao}.`);
      notificacoesApi.create('armazem', 'Material adicional pedido', `OP ${ordem?.referencia}: ${novoMat.descricao} (${qty} un).`, numId).catch(() => {});

      if (stock.materialId) {
        await materialsApi.deductByName(stock.materialId, qty, ordem?.referencia ?? '');
      }

      closeAddMaterial();
      load();
    } catch (e) { console.error(e); }
  }

  if (isLoading && !ordem) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!ordem) {
    return (
      <View style={styles.container}>
        <AppHeader section="PRODUÇÃO" userName={getDisplayName()} onLogoPress={() => router.push('/(tabs)')} onUserPress={() => router.push('/(tabs)/profile')} />
        <View style={styles.centered}>
          <Text style={styles.notFound}>Ordem não encontrada.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusKey = isPaused ? 'pausada' : (ordem.status ?? 'planeamento');
  const displayEstado = isPaused ? 'PAUSADA' : (ESTADO_LABEL[ordem.status] ?? ordem.status);
  const badge = ESTADO_BADGE[statusKey] ?? {bg: Colors.gray500, color: '#fff'};
  const podeIniciar = ordem.status === 'planeamento' && !isPaused;
  const emProducao  = ordem.status === 'em_producao' || isPaused;
  const producaoConcluida = ['qualidade', 'expedicao', 'montagem', 'concluida'].includes(ordem.status) || timerDone;
  const canControl  = ['producao', 'direcao'].includes(role);

  return (
    <View style={styles.container}>
      <AppHeader
        section="PRODUÇÃO"
        subtitle={ordem.referencia}
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')}><Text style={styles.breadcrumbLink}>PRODUÇÃO</Text></TouchableOpacity>
        <Text style={styles.breadcrumbSep}> › </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}><Text style={styles.breadcrumbLink}>ORDENS DE PRODUÇÃO</Text></TouchableOpacity>
        <Text style={styles.breadcrumbSep}> › </Text>
        <Text style={styles.breadcrumbCurrent}>{ordem.referencia}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />}>

        {!!notification && (
          <View style={[styles.notifBox, {flexDirection: 'row', alignItems: 'center', gap: 8}]}>
            <Info size={14} color="#166534" />
            <Text style={[styles.notifText, {flex: 1}]}>{notification}</Text>
          </View>
        )}

        {/* ── Info card ── */}
        <View style={styles.card}>
          <View style={[styles.cardHeader, {justifyContent: 'space-between'}]}>
            <View style={{flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <ClipboardList size={14} color="rgba(255,255,255,0.75)" />
              <Text style={styles.cardHeaderTitle} numberOfLines={1}>
                {ordem.referencia} — {(ordem.descricao ?? '').toUpperCase()}
              </Text>
            </View>
            <View style={[styles.badge, {backgroundColor: badge.bg}]}>
              <Text style={styles.badgeText}>{displayEstado}</Text>
            </View>
          </View>
          <View style={styles.infoGrid}>
            {[
              {label: 'CLIENTE',          value: ordem.cliente},
              {label: 'PRIORIDADE',       value: (ordem.prioridade ?? '—').toUpperCase()},
              {label: 'ENTREGA PREVISTA', value: ordem.dataFimPrevista ? formatDate(ordem.dataFimPrevista) : '—'},
              {label: 'RESPONSÁVEL',      value: ordem.responsavel ?? '—'},
              {label: 'INÍCIO PRODUÇÃO',  value: ordem.dataInicio ? formatDate(ordem.dataInicio) : '—'},
              {label: 'FIM PRODUÇÃO',     value: ordem.dataFimReal ? formatDate(ordem.dataFimReal) : '—'},
            ].map(item => (
              <View key={item.label} style={styles.infoField}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Controlo de Produção ── */}
        {canControl && (
          <View style={styles.card}>
            <SectionHeader icon={<Clock size={14} color="rgba(255,255,255,0.75)" />} title="CONTROLO DE PRODUÇÃO" />
            <View style={styles.timerBody}>
              {producaoConcluida ? (
                <View style={styles.timerRow}>
                  <CheckCircle size={20} color="#16a34a" />
                  <Text style={styles.timerDoneText}>Produção concluída</Text>
                  <Text style={styles.timerValue}>{formatTime(timerSecs)}</Text>
                </View>
              ) : podeIniciar ? (
                <TouchableOpacity style={styles.iniciarBtn} onPress={handleIniciar} activeOpacity={0.85}>
                  <Play size={15} color="#fff" fill="#fff" />
                  <Text style={styles.iniciarBtnText}>INICIAR PRODUÇÃO</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.timerRow}>
                  <View style={[styles.timerDisplay, {borderColor: isPaused ? '#fed7aa' : '#bbf7d0', backgroundColor: isPaused ? '#fff7ed' : '#f0fdf4'}]}>
                    <View style={[styles.timerDot, {backgroundColor: isPaused ? ORANGE : Colors.success}]} />
                    <Text style={[styles.timerValue, {color: isPaused ? ORANGE : '#16a34a'}]}>{formatTime(timerSecs)}</Text>
                  </View>
                  <TouchableOpacity style={[styles.timerBtn, {backgroundColor: isPaused ? Colors.success : ORANGE}]} onPress={handlePausar} activeOpacity={0.85}>
                    {isPaused
                      ? <><Play size={13} color="#fff" fill="#fff" /><Text style={styles.timerBtnText}>RETOMAR</Text></>
                      : <><Pause size={13} color="#fff" fill="#fff" /><Text style={styles.timerBtnText}>PAUSAR</Text></>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.timerBtn, {backgroundColor: Colors.danger}]} onPress={handleTerminar} activeOpacity={0.85}>
                    <Square size={13} color="#fff" fill="#fff" />
                    <Text style={styles.timerBtnText}>TERMINAR</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Materiais Previstos ── */}
        {necessarios.length > 0 && (
          <View style={styles.card}>
            <SectionHeader icon={<Package size={14} color="rgba(255,255,255,0.75)" />} title="MATERIAIS PREVISTOS" />
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeadText, {flex: 1}]}>MATERIAL</Text>
              <Text style={styles.tableHeadText}>QTD.</Text>
            </View>
            {necessarios.map(m => (
              <View key={m.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, {flex: 1}]}>{m.descricao}</Text>
                <Text style={styles.tableCell}>{m.quantidade}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Pedidos de Material Adicional ── */}
        <View style={styles.card}>
          <SectionHeader
            icon={<Plus size={14} color="rgba(255,255,255,0.75)" />}
            title="MATERIAL ADICIONAL PEDIDO"
            action={canControl ? (
              <TouchableOpacity style={styles.pedirBtn} onPress={() => setShowAddMaterial(true)} activeOpacity={0.85}>
                <Text style={styles.pedirBtnText}>+ PEDIR MATERIAL</Text>
              </TouchableOpacity>
            ) : undefined}
          />
          {pedidos.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>Nenhum pedido de material adicional.</Text>
            </View>
          ) : (
            pedidos.map((p, i) => (
              <View key={p.id} style={[styles.tableRow, i < pedidos.length - 1 && styles.tableRowBorder]}>
                <View style={{flex: 1}}>
                  <Text style={styles.tableCell}>{p.descricao}</Text>
                  <Text style={styles.tableCellSub}>{formatDate(p.pedidoEm)} · {p.estado}</Text>
                </View>
                <Text style={styles.tableCellBold}>Qty: {p.quantidade}</Text>
              </View>
            ))
          )}
        </View>

        {/* ── Histórico ── */}
        <View style={styles.card}>
          <SectionHeader icon={<History size={14} color="rgba(255,255,255,0.75)" />} title="HISTÓRICO DE REGISTOS" />
          {historico.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>Sem registos.</Text>
            </View>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeadText, {width: 110}]}>DATA</Text>
                <Text style={[styles.tableHeadText, {flex: 1}]}>OPERADOR</Text>
                <Text style={[styles.tableHeadText, {flex: 1}]}>DESCRIÇÃO</Text>
              </View>
              {historico.map((reg, i) => (
                <View key={reg.id} style={[styles.tableRow, styles.tableRowHistory, i < historico.length - 1 && styles.tableRowBorder]}>
                  <Text style={[styles.tableCell, {width: 110}]}>{formatDate(reg.data)}</Text>
                  <Text style={[styles.tableCell, {flex: 1}]}>{reg.operador}</Text>
                  <Text style={[styles.tableCell, {flex: 1}]}>{reg.descricao}</Text>
                </View>
              ))}
            </>
          )}
        </View>

      </ScrollView>

      <BottomNavBar />

      {/* ── Modal Pedir Material ── */}
      <Modal visible={showAddMaterial} transparent animationType="fade" onRequestClose={closeAddMaterial}>
        <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeAddMaterial}>
            <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Pedir Material Adicional</Text>

              {!!matStockError && (
                <View style={styles.stockErrorBox}>
                  <Text style={styles.stockErrorTitle}>⚠ Stock insuficiente</Text>
                  <Text style={styles.stockErrorText}>{matStockError}</Text>
                </View>
              )}

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>MATERIAL / DESCRIÇÃO</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    novoMat.descricao.trim() && !novoMat.valid && styles.modalInputError,
                    novoMat.valid && styles.modalInputValid,
                  ]}
                  placeholder="Escreve para pesquisar..."
                  placeholderTextColor={Colors.gray400}
                  value={novoMat.descricao}
                  onChangeText={handleMatDescricaoChange}
                  autoFocus
                />
                {matSuggestions.length > 0 && (
                  <View style={styles.suggBox}>
                    {matSuggestions.map((s, i) => (
                      <TouchableOpacity key={i} style={styles.suggItem} onPress={() => selectMatSuggestion(s)}>
                        <Text style={styles.suggText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {novoMat.descricao.trim() && !novoMat.valid && (
                  <Text style={styles.modalErrorText}>Seleciona um material da lista do inventário</Text>
                )}
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>QUANTIDADE</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ex: 2"
                  placeholderTextColor={Colors.gray400}
                  value={novoMat.qty}
                  onChangeText={v => setNovoMat(d => ({...d, qty: v}))}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={closeAddMaterial} activeOpacity={0.85}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalConfirmBtn, !novoMat.valid && styles.modalConfirmBtnDisabled]}
                  onPress={handleAddMaterial}
                  disabled={!novoMat.valid}
                  activeOpacity={0.85}>
                  <Text style={styles.modalConfirmText}>Pedir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md},
  notFound: {color: Colors.gray500, fontSize: FontSize.base},
  backBtn: {backgroundColor: NAVY, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm},
  backBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm},

  breadcrumb: {backgroundColor: ORANGE, paddingHorizontal: Spacing.base, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap'},
  breadcrumbLink: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 10, letterSpacing: 1, opacity: 0.85},
  breadcrumbSep:  {color: 'rgba(255,255,255,0.6)', fontSize: 10, marginHorizontal: 4},
  breadcrumbCurrent: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 10, letterSpacing: 1},

  scroll: {flex: 1},
  scrollContent: {padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing['3xl']},

  notifBox: {backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 10, padding: Spacing.md},
  notifText: {fontSize: FontSize.sm, color: '#166534', fontFamily: 'Exo2_400Regular'},

  card: {backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2},
  cardHeader: {backgroundColor: NAVY, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm},
  cardHeaderTitle: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 11, flex: 1},

  badge: {paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, flexShrink: 0},
  badgeText: {color: '#fff', fontSize: 9, fontFamily: 'Exo2_700Bold', letterSpacing: 0.5},

  infoGrid: {padding: Spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md},
  infoField: {width: '47%'},
  infoLabel: {fontSize: 9, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 1, marginBottom: 3},
  infoValue: {fontSize: 12, fontFamily: 'Exo2_600SemiBold', color: Colors.gray900},

  timerBody: {padding: Spacing.md},
  timerRow: {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap'},
  timerDisplay: {flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm},
  timerDot: {width: 8, height: 8, borderRadius: 4},
  timerValue: {fontFamily: 'monospace', fontSize: 15, letterSpacing: 1, fontWeight: '700'},
  timerDoneText: {fontSize: FontSize.sm, color: '#166534', fontFamily: 'Exo2_600SemiBold'},
  timerBtn: {flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm},
  timerBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 12},
  iniciarBtn: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.success, borderRadius: 8, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md},
  iniciarBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 0.5},

  tableHeader: {flexDirection: 'row', backgroundColor: '#f8fafc', padding: Spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'},
  tableHeadText: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray500, letterSpacing: 1},
  tableRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2},
  tableRowHistory: {alignItems: 'flex-start'},
  tableRowBorder: {borderBottomWidth: 1, borderBottomColor: '#f5f5f5'},
  tableCell: {fontSize: 12, color: Colors.gray900, fontFamily: 'Exo2_400Regular'},
  tableCellSub: {fontSize: 10, color: Colors.gray400, marginTop: 2, fontFamily: 'Exo2_400Regular'},
  tableCellBold: {fontSize: 12, fontFamily: 'Exo2_600SemiBold', color: Colors.gray700, flexShrink: 0, marginLeft: Spacing.sm},

  pedirBtn: {backgroundColor: ORANGE, borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 5},
  pedirBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 10},
  emptySection: {padding: Spacing.xl, alignItems: 'center'},
  emptySectionText: {color: Colors.gray400, fontSize: 12, fontFamily: 'Exo2_400Regular', textAlign: 'center'},

  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl},
  modalBox: {backgroundColor: '#fff', borderRadius: 16, padding: Spacing.lg, width: '100%', shadowColor: '#000', shadowOffset: {width: 0, height: 16}, shadowOpacity: 0.2, shadowRadius: 48, elevation: 20},
  modalTitle: {fontFamily: 'Exo2_700Bold', fontSize: 14, color: NAVY, marginBottom: Spacing.base},
  modalField: {marginBottom: Spacing.md},
  modalLabel: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 1, marginBottom: 5},
  modalInput: {borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, padding: Spacing.sm + 2, fontSize: FontSize.sm, color: Colors.gray900, fontFamily: 'Exo2_400Regular', backgroundColor: '#fff'},
  modalInputError: {borderColor: Colors.danger},
  modalInputValid: {borderColor: Colors.success, backgroundColor: '#f0fdf4'},
  modalErrorText: {fontSize: FontSize.xs, color: Colors.danger, marginTop: 3, fontFamily: 'Exo2_400Regular'},
  modalActions: {flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm},
  modalCancelBtn: {flex: 1, backgroundColor: Colors.gray500, borderRadius: BorderRadius.full, paddingVertical: 11, alignItems: 'center'},
  modalCancelText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 12},
  modalConfirmBtn: {flex: 1, backgroundColor: ORANGE, borderRadius: BorderRadius.full, paddingVertical: 11, alignItems: 'center'},
  modalConfirmBtnDisabled: {backgroundColor: Colors.gray300},
  modalConfirmText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 12},

  stockErrorBox: {
    backgroundColor: '#fff5f5',
    borderWidth: 1.5,
    borderColor: Colors.danger,
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  stockErrorTitle: {
    color: Colors.danger,
    fontFamily: 'Exo2_700Bold',
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  stockErrorText: {
    color: Colors.danger,
    fontFamily: 'Exo2_400Regular',
    fontSize: FontSize.xs,
    lineHeight: 18,
  },

  suggBox: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border,
    borderRadius: 8, marginTop: 2, elevation: 6,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4,
  },
  suggItem: {paddingHorizontal: Spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.gray50},
  suggText: {fontSize: FontSize.sm, color: Colors.gray800, fontFamily: 'Exo2_400Regular'},
});
