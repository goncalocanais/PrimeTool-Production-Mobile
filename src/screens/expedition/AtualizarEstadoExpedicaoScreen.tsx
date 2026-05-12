import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import {useRouter} from 'expo-router';
import {ChevronDown, Plus, X} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';
import {expeditionApi} from '../../api/expedition';
import {supabase} from '../../lib/supabase';
import {Expedicao} from '../../types';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;

type ExpedicaoStatus = 'pendente' | 'em_preparacao' | 'pronto' | 'enviado' | 'entregue';

const ESTADO_LABEL: Record<string, string> = {
  pendente:       'Pendente',
  em_preparacao:  'Em Preparação',
  pronto:         'Pronto',
  enviado:        'Em Trânsito',
  entregue:       'Entregue',
};

const ESTADO_STYLE: Record<string, {bg: string; text: string}> = {
  pendente:      {bg: '#fff3e0', text: '#e65100'},
  em_preparacao: {bg: '#e3f2fd', text: '#1565c0'},
  pronto:        {bg: '#f3e5f5', text: '#6a1b9a'},
  enviado:       {bg: '#e0f2fe', text: '#0277bd'},
  entregue:      {bg: '#e8f5e9', text: '#2e7d32'},
};

const ESTADOS: ExpedicaoStatus[] = ['pendente','em_preparacao','pronto','enviado','entregue'];

interface Veiculo {id: number; matricula: string; descricao: string;}

function EstadoBadge({estado, onChange}: {estado: string; onChange: (e: ExpedicaoStatus) => void}) {
  const [open, setOpen] = useState(false);
  const style = ESTADO_STYLE[estado] ?? {bg: Colors.gray100, text: Colors.gray600};
  return (
    <View>
      <TouchableOpacity style={[badgeStyles.badge, {backgroundColor: style.bg}]} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={[badgeStyles.text, {color: style.text}]}>{ESTADO_LABEL[estado] ?? estado}</Text>
        <ChevronDown size={12} color={style.text} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={badgeStyles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={badgeStyles.menu}>
            {ESTADOS.map(e => {
              const s = ESTADO_STYLE[e];
              return (
                <TouchableOpacity
                  key={e}
                  style={[badgeStyles.menuItem, e === estado && {backgroundColor: Colors.gray50}]}
                  onPress={() => {onChange(e); setOpen(false);}}>
                  <View style={[badgeStyles.dot, {backgroundColor: s.text}]} />
                  <Text style={[badgeStyles.menuText, {color: s.text}, e === estado && {fontFamily: 'Exo2_700Bold'}]}>
                    {ESTADO_LABEL[e]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full},
  text: {fontFamily: 'Exo2_700Bold', fontSize: 11},
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center'},
  menu: {backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', minWidth: 180, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8},
  menuItem: {flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md},
  dot: {width: 8, height: 8, borderRadius: 4, flexShrink: 0},
  menuText: {fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular'},
});

function ExpedicaoCard({exp, onEstadoChange}: {exp: Expedicao; onEstadoChange: (id: number, e: ExpedicaoStatus) => void}) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.topRow}>
        <View style={{flex: 1, minWidth: 0}}>
          <View style={cardStyles.idRow}>
            <Text style={cardStyles.id}>{exp.referencia}</Text>
            <Text style={cardStyles.dot}>·</Text>
            <Text style={cardStyles.obra}>{exp.ordemProducao?.referencia ?? '—'}</Text>
          </View>
          <Text style={cardStyles.cliente}>{exp.destinatario}</Text>
          <Text style={cardStyles.veiculo}>{exp.transportadora || '—'} · {exp.guiaTransporte || '—'}</Text>
          <Text style={cardStyles.morada} numberOfLines={1}>{exp.moradaEntrega}</Text>
        </View>
        <View style={cardStyles.rightCol}>
          {exp.dataPrevisaoEntrega && (
            <Text style={cardStyles.date}>{exp.dataPrevisaoEntrega.split('T')[0].split('-').reverse().join('/')}</Text>
          )}
          {exp.dataEnvio && (
            <Text style={cardStyles.date}>Enviado: {exp.dataEnvio.split('T')[0].split('-').reverse().join('/')}</Text>
          )}
          <EstadoBadge estado={exp.status} onChange={e => onEstadoChange(exp.id, e)} />
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md},
  topRow: {flexDirection: 'row', gap: Spacing.sm},
  idRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4},
  id: {fontFamily: 'Exo2_800ExtraBold', fontSize: 14, color: NAVY},
  dot: {fontSize: 12, color: Colors.gray500},
  obra: {fontSize: FontSize.sm, color: Colors.gray700},
  cliente: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, color: Colors.gray900, marginBottom: 2},
  veiculo: {fontSize: 12, color: Colors.primaryLight, marginBottom: 2},
  morada: {fontSize: 12, color: Colors.gray400},
  rightCol: {alignItems: 'flex-end', gap: 6, flexShrink: 0},
  date: {fontSize: 11, color: Colors.gray400, textAlign: 'right'},
});

const EMPTY_NOVA = {ordemRef: '', morada: '', transportadora: '', guia: '', veiculoId: ''};

export const AtualizarEstadoExpedicaoScreen: React.FC = () => {
  const router   = useRouter();
  const user     = useAppSelector(s => s.auth.user);
  const canCreate = ['expedicao', 'direcao'].includes(user?.perfil ?? '');

  const [expedicoes, setExpedicoes]     = useState<Expedicao[]>([]);
  const [veiculos, setVeiculos]         = useState<Veiculo[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [showNova, setShowNova]         = useState(false);
  const [nova, setNova]                 = useState(EMPTY_NOVA);
  const [novaError, setNovaError]       = useState('');
  const [showVeiculoPicker, setShowVeiculoPicker] = useState(false);

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [exps, veicsResult] = await Promise.all([
        expeditionApi.getAll(),
        supabase.from('expedicao_veiculo').select('id, matricula, descricao').eq('ativo', true),
      ]);
      setExpedicoes(exps);
      setVeiculos((veicsResult.data ?? []) as Veiculo[]);
    } catch (e) {
      console.error('Erro ao carregar expedições:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEstadoChange = async (id: number, novoEstado: ExpedicaoStatus) => {
    try {
      await expeditionApi.updateStatus(id, novoEstado);
      load();
    } catch (e) {
      console.error('Erro ao atualizar estado:', e);
    }
  };

  const handleCriarGuia = async () => {
    if (!nova.ordemRef.trim()) {
      setNovaError('Referência da obra é obrigatória.');
      return;
    }
    try {
      const veiculo = veiculos.find(v => String(v.id) === nova.veiculoId);
      await expeditionApi.create({
        moradaEntrega:    nova.morada.trim() || '—',
        transportadora:   veiculo ? `${veiculo.descricao} (${veiculo.matricula})` : nova.transportadora.trim() || '—',
        guiaTransporte:   nova.guia.trim() || '',
        observacoes:      '',
        ordemProducaoId:  0,
      });
      setNova(EMPTY_NOVA);
      setNovaError('');
      setShowNova(false);
      load();
    } catch (e) {
      console.error('Erro ao criar guia:', e);
      setNovaError('Erro ao criar. Verifique a referência da obra.');
    }
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
        <Text style={styles.sectionTitle}>GUIAS DE TRANSPORTE</Text>
        {canCreate && (
          <TouchableOpacity style={styles.novaBtn} onPress={() => setShowNova(true)} activeOpacity={0.85}>
            <Plus size={16} color="#fff" strokeWidth={3} />
            <Text style={styles.novaBtnText}>Nova Guia</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />}>

        {isLoading && expedicoes.length === 0 && (
          <View style={{paddingTop: 40, alignItems: 'center'}}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}

        {expedicoes.map(exp => (
          <ExpedicaoCard key={exp.id} exp={exp} onEstadoChange={handleEstadoChange} />
        ))}

        {!isLoading && expedicoes.length === 0 && (
          <Text style={styles.hint}>Sem expedições registadas.</Text>
        )}
        {expedicoes.length > 0 && (
          <Text style={styles.hint}>Toque no estado para alterar.</Text>
        )}
      </ScrollView>

      <BottomNavBar />

      {/* Nova Guia modal */}
      <Modal visible={showNova} transparent animationType="slide" onRequestClose={() => setShowNova(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowNova(false)}>
          <View style={styles.novaBox} onStartShouldSetResponder={() => true}>
            <View style={styles.novaHeader}>
              <Text style={styles.novaTitle}>Nova Guia de Transporte</Text>
              <TouchableOpacity onPress={() => setShowNova(false)}>
                <X size={20} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            {([
              {label: 'REFERÊNCIA DA OBRA *', key: 'ordemRef',      placeholder: 'Ex: 2026-0005'},
              {label: 'MORADA DE ENTREGA',    key: 'morada',        placeholder: 'Rua, nº, localidade'},
              {label: 'TRANSPORTADORA',       key: 'transportadora',placeholder: 'Nome da transportadora'},
              {label: 'GUIA DE TRANSPORTE',   key: 'guia',          placeholder: 'Nº da guia'},
            ] as {label: string; key: string; placeholder: string}[]).map(f => (
              <View key={f.key} style={styles.novaField}>
                <Text style={styles.novaLabel}>{f.label}</Text>
                <TextInput
                  style={styles.novaInput}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.gray400}
                  value={(nova as any)[f.key]}
                  onChangeText={v => {setNova(p => ({...p, [f.key]: v})); setNovaError('');}}
                />
              </View>
            ))}

            {veiculos.length > 0 && (
              <View style={[styles.novaField, {zIndex: 999}]}>
                <Text style={styles.novaLabel}>VEÍCULO</Text>
                <TouchableOpacity
                  style={styles.veiculoPickerBtn}
                  onPress={() => setShowVeiculoPicker(p => !p)}
                  activeOpacity={0.85}>
                  <Text style={[styles.veiculoPickerText, !nova.veiculoId && {color: Colors.gray400}]}>
                    {nova.veiculoId
                      ? (() => { const v = veiculos.find(v => String(v.id) === nova.veiculoId); return v ? `${v.descricao} (${v.matricula})` : ''; })()
                      : 'Selecionar veículo'} ▾
                  </Text>
                </TouchableOpacity>
                {showVeiculoPicker && (
                  <View style={styles.veiculoDropdown}>
                    <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                      {veiculos.map(v => (
                        <TouchableOpacity
                          key={v.id}
                          style={styles.veiculoItem}
                          onPress={() => {setNova(p => ({...p, veiculoId: String(v.id)})); setShowVeiculoPicker(false);}}
                          activeOpacity={0.85}>
                          <Text style={styles.veiculoItemNome}>{v.descricao} ({v.matricula})</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}

            {!!novaError && <Text style={styles.errorText}>{novaError}</Text>}

            <TouchableOpacity style={styles.novaSaveBtn} onPress={handleCriarGuia} activeOpacity={0.85}>
              <Text style={styles.novaSaveBtnText}>CRIAR GUIA</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  toolbar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm},
  sectionTitle: {fontFamily: 'Exo2_800ExtraBold', fontSize: 12, letterSpacing: 3, color: NAVY},
  novaBtn: {flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.success, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 8},
  novaBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 12},
  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl']},
  hint: {textAlign: 'center', fontSize: 12, color: Colors.gray400, marginTop: Spacing.md},
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl},
  novaBox: {backgroundColor: '#fff', borderRadius: 16, padding: Spacing.lg, width: '100%', shadowColor: '#000', shadowOffset: {width: 0, height: 16}, shadowOpacity: 0.2, shadowRadius: 48, elevation: 20},
  novaHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base},
  novaTitle: {fontFamily: 'Exo2_700Bold', fontSize: 14, color: NAVY},
  novaField: {marginBottom: Spacing.sm},
  novaLabel: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 1, marginBottom: 4},
  novaInput: {borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, padding: Spacing.sm + 2, fontSize: FontSize.sm, color: Colors.gray900, fontFamily: 'Exo2_400Regular'},
  errorText: {fontSize: 12, color: Colors.danger, fontFamily: 'Exo2_400Regular', marginBottom: Spacing.sm},
  novaSaveBtn: {backgroundColor: ORANGE, borderRadius: BorderRadius.full, paddingVertical: 12, alignItems: 'center', marginTop: Spacing.sm},
  novaSaveBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1},
  veiculoPickerBtn: {borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, padding: Spacing.sm + 2, backgroundColor: '#fff'},
  veiculoPickerText: {fontSize: FontSize.sm, color: Colors.gray900, fontFamily: 'Exo2_400Regular'},
  veiculoDropdown: {position: 'absolute', top: 60, left: 0, right: 0, maxHeight: 200, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: Colors.border, zIndex: 999, elevation: 8, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.15, shadowRadius: 6, overflow: 'hidden'},
  veiculoItem: {paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm},
  veiculoItemNome: {fontSize: FontSize.sm, color: Colors.gray700, fontFamily: 'Exo2_400Regular'},
});
