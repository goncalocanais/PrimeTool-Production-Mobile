import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, RefreshControl, FlatList, Keyboard, Alert,
} from 'react-native';
import {useRouter} from 'expo-router';
import {ChevronDown, Plus, X} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar, DateInput} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';
import {expeditionApi} from '../../api/expedition';
import {ordersApi} from '../../api/orders';
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

function EstadoBadge({estado, onChange, canEdit}: {estado: string; onChange: (e: ExpedicaoStatus) => void; canEdit: boolean}) {
  const [open, setOpen] = useState(false);
  const style = ESTADO_STYLE[estado] ?? {bg: Colors.gray100, text: Colors.gray600};
  if (!canEdit) {
    return (
      <View style={[badgeStyles.badge, {backgroundColor: style.bg}]}>
        <Text style={[badgeStyles.text, {color: style.text}]}>{ESTADO_LABEL[estado] ?? estado}</Text>
      </View>
    );
  }
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

function ExpedicaoCard({exp, onEstadoChange, canEdit}: {exp: Expedicao; onEstadoChange: (id: number, e: ExpedicaoStatus) => void; canEdit: boolean}) {
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
          <EstadoBadge estado={exp.status} onChange={e => onEstadoChange(exp.id, e)} canEdit={canEdit} />
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

const EMPTY_NOVA = {morada: '', guia: '', veiculoId: '', dataPrevisao: ''};

export const AtualizarEstadoExpedicaoScreen: React.FC = () => {
  const router   = useRouter();
  const user     = useAppSelector(s => s.auth.user);
  const canCreate = ['expedicao', 'direcao'].includes(user?.perfil ?? '');
  const canEdit   = ['expedicao', 'direcao'].includes(user?.perfil ?? '');

  const [expedicoes, setExpedicoes]     = useState<Expedicao[]>([]);
  const [veiculos, setVeiculos]         = useState<Veiculo[]>([]);
  const [isLoading, setIsLoading]       = useState(false);
  const [showNova, setShowNova]         = useState(false);
  const [nova, setNova]                 = useState(EMPTY_NOVA);
  const [novaError, setNovaError]       = useState('');
  const [showVeiculoPicker, setShowVeiculoPicker] = useState(false);
  const [opsExpedicao, setOpsExpedicao] = useState<{id: number; referencia: string; descricao: string}[]>([]);
  const [selectedOpId, setSelectedOpId] = useState<number | null>(null);
  const [showOpPicker, setShowOpPicker] = useState(false);

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
    } catch (e) {
      console.error('Erro ao atualizar estado da expedição:', e);
      Alert.alert('Erro', 'Não foi possível atualizar o estado da expedição.');
      return;
    }
    if (novoEstado === 'entregue') {
      const ordemId = expedicoes.find(e => e.id === id)?.ordemProducaoId;
      if (ordemId) {
        try {
          await ordersApi.updateStatus(ordemId, 'montagem');
        } catch (e) {
          console.error('Erro ao transitar OP para montagem:', e);
        }
      }
    }
    load();
  };

  const openNova = async () => {
    try {
      const all = await ordersApi.getAll();
      const ops = all.filter(o => o.status === 'expedicao');
      setOpsExpedicao(ops.map(o => ({id: o.id, referencia: o.referencia, descricao: o.descricao})));
      if (ops.length > 0) {
        setSelectedOpId(ops[0].id);
        setNova(p => ({...p, guia: ops[0].referencia}));
      }
    } catch (e) { console.error(e); }
    setShowNova(true);
  };

  const handleCriarGuia = async () => {
    if (!selectedOpId) {
      setNovaError('Selecione uma ordem de produção.');
      return;
    }
    Keyboard.dismiss();
    try {
      const veiculo = veiculos.find(v => String(v.id) === nova.veiculoId);
      await expeditionApi.create({
        moradaEntrega:         nova.morada.trim() || '—',
        transportadora:        veiculo ? `${veiculo.descricao} (${veiculo.matricula})` : '—',
        guiaTransporte:        nova.guia.trim() || '',
        observacoes:           '',
        ordemProducaoId:       selectedOpId,
        dataPrevisaoEntrega:   nova.dataPrevisao || undefined,
      });
      setNova(EMPTY_NOVA);
      setSelectedOpId(null);
      setShowOpPicker(false);
      setNovaError('');
      setShowNova(false);
      load();
    } catch (e) {
      console.error('Erro ao criar guia:', e);
      setNovaError('Erro ao criar guia de transporte.');
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
          <TouchableOpacity style={styles.novaBtn} onPress={openNova} activeOpacity={0.85}>
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
          <ExpedicaoCard key={exp.id} exp={exp} onEstadoChange={handleEstadoChange} canEdit={canEdit} />
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
      <Modal visible={showNova} transparent animationType="slide" hardwareAccelerated onRequestClose={() => { Keyboard.dismiss(); setShowNova(false); }}>
        <View style={styles.overlay}>
          <ScrollView style={{width: '100%'}} contentContainerStyle={{flexGrow: 1, justifyContent: 'center', alignItems: 'center'}} keyboardShouldPersistTaps="handled">
          <View style={styles.novaBox}>
            <View style={styles.novaHeader}>
              <Text style={styles.novaTitle}>Nova Guia de Transporte</Text>
              <TouchableOpacity onPress={() => { Keyboard.dismiss(); setShowNova(false); }}>
                <X size={20} color={Colors.gray500} />
              </TouchableOpacity>
            </View>

            <View style={styles.novaField}>
              <Text style={styles.novaLabel}>ORDEM DE PRODUÇÃO *</Text>
              {opsExpedicao.length === 0 ? (
                <View style={styles.emptyOps}>
                  <Text style={styles.emptyOpsText}>Nenhuma OP pronta para expedição.</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity style={styles.novaInput} onPress={() => setShowOpPicker(true)} activeOpacity={0.85}>
                    <Text style={{fontSize: FontSize.sm, color: selectedOpId ? Colors.gray900 : Colors.gray400, fontFamily: 'Exo2_400Regular'}}>
                      {opsExpedicao.find(o => o.id === selectedOpId)?.referencia || 'Selecionar OP'} ▾
                    </Text>
                  </TouchableOpacity>
                  {selectedOpId && (
                    <Text style={styles.opDescricao}>{opsExpedicao.find(o => o.id === selectedOpId)?.descricao}</Text>
                  )}
                </>
              )}
            </View>

            <View style={styles.novaField}>
              <Text style={styles.novaLabel}>GUIA DE TRANSPORTE</Text>
              <View style={styles.readonlyField}>
                <Text style={styles.readonlyText}>EXP-{nova.guia}</Text>
              </View>
            </View>

            <View style={styles.novaField}>
              <Text style={styles.novaLabel}>MORADA DE ENTREGA</Text>
              <TextInput
                style={styles.novaInput}
                placeholder="Rua, nº, localidade"
                placeholderTextColor={Colors.gray400}
                value={nova.morada}
                onChangeText={v => setNova(p => ({...p, morada: v}))}
              />
            </View>

            <View style={styles.novaField}>
              <Text style={styles.novaLabel}>DATA PREVISÃO ENTREGA</Text>
              <DateInput
                style={styles.novaInput}
                value={nova.dataPrevisao}
                onChangeText={v => setNova(p => ({...p, dataPrevisao: v}))}
              />
            </View>

            {veiculos.length > 0 && (
              <View style={styles.novaField}>
                <Text style={styles.novaLabel}>VEÍCULO</Text>
                <TouchableOpacity style={styles.novaInput} onPress={() => setShowVeiculoPicker(p => !p)} activeOpacity={0.85}>
                  <Text style={{fontSize: FontSize.sm, color: nova.veiculoId ? Colors.gray900 : Colors.gray400, fontFamily: 'Exo2_400Regular'}}>
                    {(() => { const v = veiculos.find(v => String(v.id) === nova.veiculoId); return v ? `${v.descricao} (${v.matricula})` : 'Selecionar veículo'; })()} ▾
                  </Text>
                </TouchableOpacity>
                {showVeiculoPicker && (
                  <View style={styles.inlineList}>
                    {veiculos.map(v => (
                      <TouchableOpacity
                        key={v.id}
                        style={[styles.inlineItem, String(v.id) === nova.veiculoId && styles.inlineItemActive]}
                        onPress={() => { setNova(p => ({...p, veiculoId: String(v.id)})); setShowVeiculoPicker(false); }}
                        activeOpacity={0.85}>
                        <Text style={[styles.inlineItemText, String(v.id) === nova.veiculoId && {color: NAVY, fontFamily: 'Exo2_700Bold'}]}>{v.descricao}</Text>
                        <Text style={styles.pickerItemDesc}>{v.matricula}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {!!novaError && <Text style={styles.errorText}>{novaError}</Text>}

            <TouchableOpacity style={styles.novaSaveBtn} onPress={handleCriarGuia} activeOpacity={0.85}>
              <Text style={styles.novaSaveBtnText}>CRIAR GUIA</Text>
            </TouchableOpacity>
          </View>
          </ScrollView>
        </View>
      </Modal>
      {/* OP e Veículo pickers — depois do Nova Guia modal para ficarem por cima */}
      <Modal visible={showOpPicker} transparent animationType="fade" onRequestClose={() => setShowOpPicker(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowOpPicker(false)}>
          <View style={[styles.pickerBox, {maxHeight: 350}]} onStartShouldSetResponder={() => true}>
            <Text style={styles.pickerTitle}>OPs prontas para expedição</Text>
            <FlatList
              data={opsExpedicao}
              keyExtractor={o => String(o.id)}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[styles.pickerItem, item.id === selectedOpId && styles.pickerItemActive]}
                  onPress={() => { setSelectedOpId(item.id); setNova(p => ({...p, guia: item.referencia})); setShowOpPicker(false); }}>
                  <Text style={[styles.pickerItemRef, item.id === selectedOpId && {color: NAVY, fontFamily: 'Exo2_700Bold'}]}>{item.referencia}</Text>
                  <Text style={styles.pickerItemDesc}>{item.descricao}</Text>
                </TouchableOpacity>
              )}
            />
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
  pickerBox: {backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', width: '90%', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8},
  pickerTitle: {fontSize: 11, fontFamily: 'Exo2_700Bold', color: NAVY, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border},
  pickerItem: {padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray50},
  pickerItemActive: {backgroundColor: '#f0f4ff'},
  pickerItemRef: {fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular', color: Colors.gray700},
  pickerItemDesc: {fontSize: 10, color: Colors.gray400, fontFamily: 'Exo2_400Regular', marginTop: 1},
  emptyOps: {padding: Spacing.md, backgroundColor: Colors.gray50, borderRadius: 8, borderWidth: 1, borderColor: Colors.border},
  emptyOpsText: {fontSize: FontSize.sm, color: Colors.gray500, fontFamily: 'Exo2_400Regular', textAlign: 'center'},
  opDescricao: {fontSize: 11, color: Colors.gray500, fontFamily: 'Exo2_400Regular', marginTop: 4, paddingLeft: 2},
  readonlyField: {borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, padding: Spacing.sm + 2, backgroundColor: Colors.gray50},
  readonlyText: {fontSize: FontSize.sm, color: Colors.gray600, fontFamily: 'Exo2_700Bold'},
  inlineList: {marginTop: 4, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff'},
  inlineItem: {paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.gray50},
  inlineItemActive: {backgroundColor: '#f0f4ff'},
  inlineItemText: {fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular', color: Colors.gray700},
});
