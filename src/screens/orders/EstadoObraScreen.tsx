import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, RefreshControl} from 'react-native';
import {useRouter} from 'expo-router';
import {Settings} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';
import {ordersApi} from '../../api/orders';
import {OrdemProducao, OPStatus} from '../../types';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;

const ESTADO_LABEL: Record<string, string> = {
  planeamento: 'PLANEAMENTO',
  em_producao: 'EM PRODUÇÃO',
  montagem:    'EM MONTAGEM',
  expedicao:   'EM EXPEDIÇÃO',
  qualidade:   'EM QUALIDADE',
  concluida:   'CONCLUÍDA',
  cancelada:   'CANCELADA',
};

const ESTADO_STYLES: Record<string, {bg: string; color: string}> = {
  planeamento: {bg: Colors.primaryLight, color: '#fff'},
  em_producao: {bg: '#3b82f6',           color: '#fff'},
  montagem:    {bg: ORANGE,              color: '#fff'},
  expedicao:   {bg: '#8b5cf6',           color: '#fff'},
  qualidade:   {bg: Colors.success,      color: '#fff'},
  concluida:   {bg: Colors.success,      color: '#fff'},
  cancelada:   {bg: Colors.danger,       color: '#fff'},
};

const ESTADO_OPTIONS: OPStatus[] = ['em_producao','montagem','expedicao','qualidade','concluida','cancelada'];

export const EstadoObraScreen: React.FC = () => {
  const router  = useRouter();
  const user    = useAppSelector(s => s.auth.user);

  const [ordens, setOrdens]           = useState<OrdemProducao[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [selectedId, setSelectedId]   = useState<number | null>(null);

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ordersApi.getAll();
      // Mostrar apenas ordens ativas (excluir concluídas e canceladas)
      setOrdens(data.filter(o => !['concluida','cancelada'].includes(o.status)));
    } catch (e) {
      console.error('Erro ao carregar ordens:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSelect = async (id: number, estado: OPStatus) => {
    try {
      await ordersApi.updateStatus(id, estado);
      setSelectedId(null);
      load();
    } catch (e) {
      console.error('Erro ao atualizar estado:', e);
    }
  };

  const currentOrdem = ordens.find(o => o.id === selectedId);

  return (
    <View style={styles.container}>
      <AppHeader
        section="PRODUÇÃO"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Text style={styles.breadcrumbLink}>PRODUÇÃO</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}> › </Text>
        <Text style={styles.breadcrumbCurrent}>ATUALIZAR ESTADO DA OP</Text>
      </View>

      <View style={styles.tableHeaderCard}>
        <View style={styles.tableHeaderTop}>
          <Settings size={15} color="#fff" />
          <Text style={styles.tableHeaderTitle}>ATUALIZAR ESTADO DA ORDEM DE PRODUÇÃO</Text>
        </View>
        <View style={styles.tableColHeaders}>
          {['REFERÊNCIA', 'ESTADO ATUAL', 'NOVO ESTADO'].map(col => (
            <Text key={col} style={styles.tableColText}>{col}</Text>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />}>

        {isLoading && ordens.length === 0 && (
          <View style={{paddingTop: 40, alignItems: 'center'}}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}

        {ordens.map(ordem => {
          const st = ESTADO_STYLES[ordem.status] ?? {bg: Colors.gray400, color: '#fff'};
          return (
            <View key={ordem.id} style={[styles.card, {borderLeftColor: st.bg}]}>
              <View style={styles.cardTop}>
                <Text style={styles.cardRef}>{ordem.referencia}</Text>
                <Text style={styles.cardNome}>{ordem.descricao}</Text>
                <Text style={styles.cardCliente}>{ordem.cliente}</Text>
              </View>
              <View style={styles.estadoRow}>
                <View style={styles.estadoCol}>
                  <Text style={styles.colLabel}>ESTADO ATUAL</Text>
                  <View style={[styles.badge, {backgroundColor: st.bg}]}>
                    <Text style={styles.badgeText}>{ESTADO_LABEL[ordem.status] ?? ordem.status}</Text>
                  </View>
                </View>
                <View style={styles.estadoCol}>
                  <Text style={styles.colLabel}>NOVO ESTADO</Text>
                  <TouchableOpacity
                    style={styles.alterarBtn}
                    onPress={() => setSelectedId(ordem.id)}
                    activeOpacity={0.85}>
                    <Text style={styles.alterarBtnText}>Alterar ▾</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        <Text style={styles.hint}>Toque em "Alterar" para mudar o estado.</Text>
      </ScrollView>

      <BottomNavBar />

      <Modal visible={!!selectedId} transparent animationType="fade" onRequestClose={() => setSelectedId(null)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSelectedId(null)}>
          <View style={styles.dropMenu}>
            <View style={styles.dropHeader}>
              <Text style={styles.dropHeaderSub}>Selecionar novo estado</Text>
              <Text style={styles.dropHeaderRef}>{currentOrdem?.referencia}</Text>
            </View>
            {ESTADO_OPTIONS.map(opt => {
              const isSelected = currentOrdem?.status === opt;
              const optSt = ESTADO_STYLES[opt] ?? {bg: Colors.gray400};
              return (
                <TouchableOpacity
                  key={opt}
                  style={[styles.dropItem, isSelected && styles.dropItemActive]}
                  onPress={() => selectedId && handleSelect(selectedId, opt)}
                  activeOpacity={0.85}>
                  <View style={[styles.dropDot, {backgroundColor: optSt.bg}]} />
                  <Text style={[styles.dropItemText, isSelected && {color: NAVY, fontFamily: 'Exo2_700Bold'}]}>
                    {ESTADO_LABEL[opt] ?? opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
  tableHeaderCard: {backgroundColor: '#fff', marginHorizontal: Spacing.base, marginTop: Spacing.md, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 5, elevation: 2},
  tableHeaderTop: {backgroundColor: NAVY, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md},
  tableHeaderTitle: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 11, letterSpacing: 1.5, flex: 1, textAlign: 'right', marginLeft: 8},
  tableColHeaders: {backgroundColor: NAVY, flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', gap: Spacing.sm},
  tableColText: {color: 'rgba(255,255,255,0.65)', fontFamily: 'Exo2_700Bold', fontSize: 10, letterSpacing: 1, flex: 1},
  scroll: {flex: 1},
  scrollContent: {padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl']},
  card: {backgroundColor: '#fff', borderRadius: 12, padding: Spacing.md, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2},
  cardTop: {marginBottom: Spacing.sm + 2},
  cardRef: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, color: NAVY},
  cardNome: {fontFamily: 'Exo2_600SemiBold', fontSize: 12, color: Colors.gray900, marginTop: 1},
  cardCliente: {fontSize: 11, color: Colors.gray400, marginTop: 1, fontFamily: 'Exo2_400Regular'},
  estadoRow: {flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.gray50},
  estadoCol: {flex: 1},
  colLabel: {color: Colors.gray400, fontSize: 10, fontFamily: 'Exo2_700Bold', marginBottom: 4},
  badge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, alignSelf: 'flex-start'},
  badgeText: {color: '#fff', fontSize: 10, fontFamily: 'Exo2_700Bold', letterSpacing: 0.3},
  alterarBtn: {backgroundColor: NAVY, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full, alignSelf: 'flex-start'},
  alterarBtnText: {color: '#fff', fontSize: 10, fontFamily: 'Exo2_700Bold'},
  hint: {textAlign: 'center', color: Colors.gray400, fontSize: 11, fontFamily: 'Exo2_400Regular', paddingVertical: Spacing.sm},
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl},
  dropMenu: {backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', minWidth: 200, shadowColor: '#000', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.18, shadowRadius: 24, elevation: 10},
  dropHeader: {padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray50},
  dropHeaderSub: {fontSize: 11, color: Colors.gray400, fontFamily: 'Exo2_400Regular'},
  dropHeaderRef: {fontSize: 12, fontFamily: 'Exo2_700Bold', color: NAVY, marginTop: 1},
  dropItem: {flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md},
  dropItemActive: {backgroundColor: '#f0f4ff'},
  dropDot: {width: 8, height: 8, borderRadius: 4, flexShrink: 0},
  dropItemText: {fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular', color: Colors.gray700},
});
