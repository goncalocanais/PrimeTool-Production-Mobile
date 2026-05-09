import React, {useState, useEffect, useRef} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput,
} from 'react-native';
import {useRouter, useLocalSearchParams} from 'expo-router';
import {Play, Pause, Square, Plus, Clock, Package, History, Info, ClipboardList, CheckCircle} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;

/* ── Types ── */
type EstadoOP = 'EM PLANEAMENTO' | 'EM PRODUÇÃO' | 'PAUSADA' | 'CONCLUÍDA' | 'EM MONTAGEM' | 'EM EXPEDIÇÃO' | 'AGUARDA MATERIAL' | 'SUSPENSA';

interface MaterialPlaneado { codigo: string; descricao: string; qty: string; }
interface MaterialAdicional { id: number; descricao: string; qty: string; data: string; utilizador: string; }
interface RegistoHistorico  { data: string; utilizador: string; descricao: string; }

interface OrdemDetalhe {
  ref: string; nome: string; cliente: string; estado: EstadoOP;
  prioridade: string; entrega: string; inicioProducao: string;
  fimProducao: string; responsavel: string;
  materiaisPlaneados: MaterialPlaneado[];
  materiaisAdicionais: MaterialAdicional[];
  historico: RegistoHistorico[];
}

/* ── Mock data ── */
const ORDENS_DETALHE: Record<string, OrdemDetalhe> = {
  '8': {ref:'2026-0008',nome:'Painel luminoso Vasco da Gama',cliente:'ADRC Vasco da Gama',estado:'EM PRODUÇÃO',prioridade:'Normal',entrega:'26/04/2026',inicioProducao:'20/03/2026 08:30',fimProducao:'—',responsavel:'João Silva',
    materiaisPlaneados:[{codigo:'CHP-001',descricao:'Chapa de aço 3mm (1000×2000)',qty:'4,00'},{codigo:'PER-002',descricao:'Perfil IPE 100 (6m)',qty:'2,00'},{codigo:'TIN-002',descricao:'Tinta RAL 9005 (5L)',qty:'2,00'},{codigo:'ELE-001',descricao:'Fio MIG 0.8mm (15kg)',qty:'1,00'}],
    materiaisAdicionais:[],historico:[{data:'20/03/2026 08:30',utilizador:'João Silva',descricao:'Produção iniciada.'},{data:'20/03/2026 08:15',utilizador:'Gonçalo Canais',descricao:'Ordem planeada.'}]},
  '9': {ref:'2026-0009',nome:'Letreiro bar ISCAC',cliente:'AEISCAC',estado:'EM PLANEAMENTO',prioridade:'Normal',entrega:'30/03/2026',inicioProducao:'—',fimProducao:'—',responsavel:'Gonçalo Canais',
    materiaisPlaneados:[{codigo:'PER-005',descricao:'Perfil HEA 160 (6ml)',qty:'1,00'},{codigo:'INX-001',descricao:'Chapa Inox 304 2mm',qty:'2,00'},{codigo:'TIN-001',descricao:'Primário Anticorrosão (5L)',qty:'1,00'}],
    materiaisAdicionais:[],historico:[]},
  '6': {ref:'2026-0006',nome:'Letreiro entrada piso 0',cliente:'AEISCAC',estado:'EM EXPEDIÇÃO',prioridade:'Normal',entrega:'25/03/2026',inicioProducao:'10/03/2026 09:00',fimProducao:'18/03/2026 17:00',responsavel:'Carlos Ferreira',
    materiaisPlaneados:[{codigo:'CHP-002',descricao:'Chapa galvanizada 1.5mm',qty:'3,00'},{codigo:'PAR-001',descricao:'Parafuso M8×30 (caixa 100)',qty:'2,00'}],
    materiaisAdicionais:[{id:1,descricao:'Tinta anticorrosão adicional',qty:'1',data:'15/03/2026 10:00',utilizador:'João Silva'}],
    historico:[{data:'18/03/2026 17:00',utilizador:'Carlos Ferreira',descricao:'Produção concluída.'},{data:'10/03/2026 09:00',utilizador:'Carlos Ferreira',descricao:'Produção iniciada.'}]},
  '7': {ref:'2026-0007',nome:'Letreiro entrada hotel',cliente:'Ascendi Operações, SA',estado:'EM EXPEDIÇÃO',prioridade:'Normal',entrega:'20/03/2026',inicioProducao:'05/03/2026 08:00',fimProducao:'15/03/2026 16:00',responsavel:'João Silva',
    materiaisPlaneados:[{codigo:'PER-003',descricao:'Perfil UNP 80 (6m)',qty:'3,00'},{codigo:'CHP-001',descricao:'Chapa de aço 3mm',qty:'2,00'}],
    materiaisAdicionais:[],historico:[{data:'15/03/2026 16:00',utilizador:'João Silva',descricao:'Produção concluída.'},{data:'05/03/2026 08:00',utilizador:'João Silva',descricao:'Produção iniciada.'}]},
  '5': {ref:'2026-0005',nome:'Sinalética exterior campus',cliente:'Universidade do Minho',estado:'EM PRODUÇÃO',prioridade:'Alta',entrega:'15/04/2026',inicioProducao:'22/03/2026 08:00',fimProducao:'—',responsavel:'João Silva',
    materiaisPlaneados:[{codigo:'PER-001',descricao:'Perfil IPE 100 (6m)',qty:'6,00'},{codigo:'CHP-003',descricao:'Chapa inox 2mm',qty:'4,00'},{codigo:'TIN-003',descricao:'Verniz protetor (5L)',qty:'3,00'}],
    materiaisAdicionais:[],historico:[{data:'22/03/2026 08:00',utilizador:'João Silva',descricao:'Produção iniciada.'}]},
  '4': {ref:'2026-0004',nome:'Painel LED fachada',cliente:'Grupo Sonae',estado:'AGUARDA MATERIAL',prioridade:'Normal',entrega:'10/05/2026',inicioProducao:'—',fimProducao:'—',responsavel:'Carlos Ferreira',
    materiaisPlaneados:[{codigo:'ELE-002',descricao:'Fio MIG 1.0mm (15kg)',qty:'2,00'},{codigo:'CHP-004',descricao:'Chapa de aço 2mm',qty:'5,00'}],
    materiaisAdicionais:[],historico:[{data:'18/03/2026 14:00',utilizador:'Carlos Ferreira',descricao:'Aguarda material — Fio MIG em falta.'}]},
  '3': {ref:'2026-0003',nome:'Totem publicidade exterior',cliente:'NOS Comunicações',estado:'CONCLUÍDA',prioridade:'Normal',entrega:'01/03/2026',inicioProducao:'15/02/2026 08:00',fimProducao:'28/02/2026 17:00',responsavel:'Carlos Ferreira',
    materiaisPlaneados:[{codigo:'PER-004',descricao:'Perfil HEA 120 (6m)',qty:'2,00'},{codigo:'TIN-001',descricao:'Primário Anticorrosão (5L)',qty:'2,00'}],
    materiaisAdicionais:[],historico:[{data:'28/02/2026 17:00',utilizador:'Carlos Ferreira',descricao:'Produção concluída.'},{data:'15/02/2026 08:00',utilizador:'Carlos Ferreira',descricao:'Produção iniciada.'}]},
  '2': {ref:'2026-0002',nome:'Estrutura metálica armazém',cliente:'Logística Rápida Lda',estado:'SUSPENSA',prioridade:'Urgente',entrega:'05/04/2026',inicioProducao:'—',fimProducao:'—',responsavel:'Gonçalo Canais',
    materiaisPlaneados:[{codigo:'PER-006',descricao:'Perfil HEA 200 (6m)',qty:'8,00'},{codigo:'CHP-001',descricao:'Chapa de aço 3mm',qty:'10,00'}],
    materiaisAdicionais:[],historico:[{data:'12/03/2026 09:00',utilizador:'Gonçalo Canais',descricao:'Ordem suspensa por decisão do cliente.'}]},
};

const ESTADO_BADGE: Record<string, {bg: string; color: string}> = {
  'EM PLANEAMENTO':  {bg: Colors.gray600,      color: '#fff'},
  'EM PRODUÇÃO':     {bg: '#3b82f6',            color: '#fff'},
  'PAUSADA':         {bg: ORANGE,              color: '#fff'},
  'CONCLUÍDA':       {bg: Colors.success,      color: '#fff'},
  'EM MONTAGEM':     {bg: ORANGE,              color: '#fff'},
  'EM EXPEDIÇÃO':    {bg: '#8b5cf6',            color: '#fff'},
  'AGUARDA MATERIAL':{bg: '#eab308',            color: '#fff'},
  'SUSPENSA':        {bg: Colors.danger,       color: '#fff'},
};

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/* ── Section card header ── */
function SectionHeader({icon, title, action}: {icon: React.ReactNode; title: string; action?: React.ReactNode}) {
  return (
    <View style={secStyles.header}>
      <View style={secStyles.left}>
        {icon}
        <Text style={secStyles.title}>{title}</Text>
      </View>
      {action}
    </View>
  );
}
const secStyles = StyleSheet.create({
  header: {
    backgroundColor: NAVY, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: Spacing.md,
    borderTopLeftRadius: 12, borderTopRightRadius: 12,
  },
  left: {flexDirection: 'row', alignItems: 'center', gap: 8},
  title: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 11, letterSpacing: 1.5},
});

/* ── Main Screen ── */
export const OrderDetailScreen: React.FC = () => {
  const {id} = useLocalSearchParams<{id: string}>();
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);
  const role = user?.perfil ?? 'producao';

  const ordemOriginal = ORDENS_DETALHE[id ?? ''];

  const [estado, setEstado]           = useState<EstadoOP>(ordemOriginal?.estado ?? 'EM PLANEAMENTO');
  const [timerSecs, setTimerSecs]     = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [inicioReal, setInicioReal]   = useState(ordemOriginal?.inicioProducao ?? '—');
  const [historico, setHistorico]     = useState<RegistoHistorico[]>(ordemOriginal?.historico ?? []);
  const [materiaisAdicionais, setMateriaisAdicionais] = useState<MaterialAdicional[]>(ordemOriginal?.materiaisAdicionais ?? []);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [novoMat, setNovoMat]         = useState({descricao: '', qty: ''});
  const [notification, setNotification] = useState('');

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => setTimerSecs(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  function nowTs() {
    const now = new Date();
    return now.toLocaleDateString('pt-PT') + ' ' + now.toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'});
  }

  function showNotif(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  }

  function handleIniciar() {
    const ts = nowTs();
    setEstado('EM PRODUÇÃO');
    setTimerActive(true);
    setInicioReal(ts);
    setHistorico(prev => [{data: ts, utilizador: getDisplayName(), descricao: 'Produção iniciada.'}, ...prev]);
    showNotif('Produção iniciada.');
  }

  function handlePausar() {
    const ts = nowTs();
    if (estado === 'EM PRODUÇÃO') {
      setEstado('PAUSADA');
      setTimerActive(false);
      setHistorico(prev => [{data: ts, utilizador: getDisplayName(), descricao: 'Produção pausada.'}, ...prev]);
      showNotif('Produção pausada.');
    } else if (estado === 'PAUSADA') {
      setEstado('EM PRODUÇÃO');
      setTimerActive(true);
      setHistorico(prev => [{data: ts, utilizador: getDisplayName(), descricao: 'Produção retomada.'}, ...prev]);
      showNotif('Produção retomada.');
    }
  }

  function handleTerminar() {
    const ts = nowTs();
    setEstado('CONCLUÍDA');
    setTimerActive(false);
    setHistorico(prev => [{data: ts, utilizador: getDisplayName(), descricao: 'Produção concluída.'}, ...prev]);
    showNotif('Produção concluída com sucesso!');
  }

  function handleAddMaterial() {
    if (!novoMat.descricao.trim()) return;
    const ts = nowTs();
    const novo: MaterialAdicional = {id: Date.now(), descricao: novoMat.descricao, qty: novoMat.qty || '1', data: ts, utilizador: getDisplayName()};
    setMateriaisAdicionais(prev => [...prev, novo]);
    setHistorico(prev => [{data: ts, utilizador: getDisplayName(), descricao: `Material adicional pedido: ${novoMat.descricao}.`}, ...prev]);
    setNovoMat({descricao: '', qty: ''});
    setShowAddMaterial(false);
  }

  if (!ordemOriginal) {
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

  const ordem = ordemOriginal;
  const badge = ESTADO_BADGE[estado] ?? {bg: Colors.gray500, color: '#fff'};
  const podeIniciar = !['EM PRODUÇÃO', 'PAUSADA', 'CONCLUÍDA'].includes(estado);
  const emProducao  = estado === 'EM PRODUÇÃO' || estado === 'PAUSADA';
  const canControl  = ['producao', 'montagem', 'direcao'].includes(role);

  return (
    <View style={styles.container}>
      <AppHeader
        section="PRODUÇÃO"
        subtitle={ordem.ref}
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Text style={styles.breadcrumbLink}>PRODUÇÃO</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}> › </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
          <Text style={styles.breadcrumbLink}>ORDENS DE PRODUÇÃO</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}> › </Text>
        <Text style={styles.breadcrumbCurrent}>{ordem.ref}</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Notificação */}
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
                {ordem.ref} — {ordem.nome.toUpperCase()}
              </Text>
            </View>
            <View style={[styles.badge, {backgroundColor: badge.bg}]}>
              <Text style={styles.badgeText}>{estado}</Text>
            </View>
          </View>
          <View style={styles.infoGrid}>
            {[
              {label: 'CLIENTE',          value: ordem.cliente},
              {label: 'PRIORIDADE',       value: ordem.prioridade},
              {label: 'ENTREGA PREVISTA', value: ordem.entrega},
              {label: 'RESPONSÁVEL',      value: ordem.responsavel},
              {label: 'INÍCIO PRODUÇÃO',  value: inicioReal},
              {label: 'FIM PRODUÇÃO',     value: estado === 'CONCLUÍDA' ? new Date().toLocaleDateString('pt-PT') : ordem.fimProducao},
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
              {estado === 'CONCLUÍDA' ? (
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
                  <View style={[styles.timerDisplay, {borderColor: estado === 'PAUSADA' ? '#fed7aa' : '#bbf7d0', backgroundColor: estado === 'PAUSADA' ? '#fff7ed' : '#f0fdf4'}]}>
                    <View style={[styles.timerDot, {backgroundColor: estado === 'PAUSADA' ? ORANGE : Colors.success}]} />
                    <Text style={[styles.timerValue, {color: estado === 'PAUSADA' ? ORANGE : '#16a34a'}]}>{formatTime(timerSecs)}</Text>
                  </View>
                  <TouchableOpacity style={[styles.timerBtn, {backgroundColor: estado === 'PAUSADA' ? Colors.success : ORANGE}]} onPress={handlePausar} activeOpacity={0.85}>
                    {estado === 'PAUSADA'
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

        {/* ── Materiais Planeados ── */}
        <View style={styles.card}>
          <SectionHeader icon={<Package size={14} color="rgba(255,255,255,0.75)" />} title="MATERIAIS PLANEADOS" />
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeadText, {flex: 1}]}>MATERIAL / DESCRIÇÃO</Text>
            <Text style={styles.tableHeadText}>QTD.</Text>
          </View>
          {ordem.materiaisPlaneados.map((mat, i) => (
            <View key={i} style={[styles.tableRow, i < ordem.materiaisPlaneados.length - 1 && styles.tableRowBorder]}>
              <View style={{flex: 1}}>
                <Text style={styles.tableCell}>{mat.codigo} — {mat.descricao}</Text>
                <Text style={styles.tableCellSub}>{mat.codigo}</Text>
              </View>
              <Text style={styles.tableCellBold}>{mat.qty}</Text>
            </View>
          ))}
        </View>

        {/* ── Materiais Adicionais ── */}
        <View style={styles.card}>
          <SectionHeader
            icon={<Plus size={14} color="rgba(255,255,255,0.75)" />}
            title="MATERIAIS ADICIONAIS PEDIDOS"
            action={
              <TouchableOpacity style={styles.pedirBtn} onPress={() => setShowAddMaterial(true)} activeOpacity={0.85}>
                <Text style={styles.pedirBtnText}>+ PEDIR MATERIAL</Text>
              </TouchableOpacity>
            }
          />
          {materiaisAdicionais.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>Nenhum pedido de material adicional registado.</Text>
            </View>
          ) : (
            materiaisAdicionais.map((mat, i) => (
              <View key={mat.id} style={[styles.tableRow, i < materiaisAdicionais.length - 1 && styles.tableRowBorder]}>
                <View style={{flex: 1}}>
                  <Text style={styles.tableCell}>{mat.descricao}</Text>
                  <Text style={styles.tableCellSub}>{mat.data} · {mat.utilizador}</Text>
                </View>
                <Text style={styles.tableCellBold}>Qty: {mat.qty}</Text>
              </View>
            ))
          )}
        </View>

        {/* ── Histórico ── */}
        <View style={styles.card}>
          <SectionHeader icon={<History size={14} color="rgba(255,255,255,0.75)" />} title="HISTÓRICO DE REGISTOS" />
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeadText, {width: 110}]}>DATA</Text>
            <Text style={[styles.tableHeadText, {flex: 1}]}>UTILIZADOR</Text>
            <Text style={[styles.tableHeadText, {flex: 1}]}>DESCRIÇÃO</Text>
          </View>
          {historico.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptySectionText}>Sem registos.</Text>
            </View>
          ) : (
            historico.map((reg, i) => (
              <View key={i} style={[styles.tableRow, styles.tableRowHistory, i < historico.length - 1 && styles.tableRowBorder]}>
                <Text style={[styles.tableCell, {width: 110}]}>{reg.data}</Text>
                <Text style={[styles.tableCell, {flex: 1}]}>{reg.utilizador}</Text>
                <Text style={[styles.tableCell, {flex: 1}]}>{reg.descricao}</Text>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      <BottomNavBar />

      {/* ── Modal Adicionar Material ── */}
      <Modal visible={showAddMaterial} transparent animationType="fade" onRequestClose={() => setShowAddMaterial(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddMaterial(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Pedir Material Adicional</Text>
            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>MATERIAL / DESCRIÇÃO</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Chapa de aço 2mm"
                placeholderTextColor={Colors.gray400}
                value={novoMat.descricao}
                onChangeText={v => setNovoMat(d => ({...d, descricao: v}))}
                autoFocus
              />
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
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddMaterial(false)} activeOpacity={0.85}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleAddMaterial} activeOpacity={0.85}>
                <Text style={styles.modalConfirmText}>Pedir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
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
  modalActions: {flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm},
  modalCancelBtn: {flex: 1, backgroundColor: Colors.gray500, borderRadius: BorderRadius.full, paddingVertical: 11, alignItems: 'center'},
  modalCancelText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 12},
  modalConfirmBtn: {flex: 1, backgroundColor: ORANGE, borderRadius: BorderRadius.full, paddingVertical: 11, alignItems: 'center'},
  modalConfirmText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 12},
});
