import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, RefreshControl, ActivityIndicator} from 'react-native';
import {useRouter} from 'expo-router';
import {ChevronDown} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';
import {montagensApi, TarefaMontagem, TarefaEstado} from '../../api/montagens';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;

const ESTADOS: TarefaEstado[] = ['pendente', 'em_curso', 'concluida', 'suspensa'];

const ESTADO_LABEL: Record<TarefaEstado, string> = {
  pendente:  'Pendente',
  em_curso:  'Em Curso',
  concluida: 'Concluída',
  suspensa:  'Suspensa',
};

const BADGE: Record<TarefaEstado, {bg: string; color: string; border: string}> = {
  pendente:  {bg: '#e0f2fe', color: '#0369a1', border: '#0369a1'},
  em_curso:  {bg: '#fff7ed', color: '#c2410c', border: '#c2410c'},
  concluida: {bg: '#dcfce7', color: '#15803d', border: '#15803d'},
  suspensa:  {bg: '#f3f4f6', color: '#6b7280', border: '#6b7280'},
};

function EstadoBadge({estado, onChange, canEdit}: {estado: TarefaEstado; onChange: (e: TarefaEstado) => void; canEdit: boolean}) {
  const [open, setOpen] = useState(false);
  const b = BADGE[estado] ?? BADGE.pendente;

  if (!canEdit) {
    return (
      <View style={[badgeStyles.badge, {backgroundColor: b.bg, borderColor: b.border}]}>
        <Text style={[badgeStyles.text, {color: b.color}]}>{ESTADO_LABEL[estado]}</Text>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[badgeStyles.badge, {backgroundColor: b.bg, borderColor: b.border}]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}>
        <Text style={[badgeStyles.text, {color: b.color}]}>{ESTADO_LABEL[estado]}</Text>
        <ChevronDown size={12} color={b.color} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={badgeStyles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={badgeStyles.menu}>
            {ESTADOS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[badgeStyles.menuItem, opt === estado && {backgroundColor: NAVY}]}
                onPress={() => {onChange(opt); setOpen(false);}}>
                <Text style={[badgeStyles.menuText, {color: opt === estado ? '#fff' : Colors.gray700}, opt === estado && {fontFamily: 'Exo2_700Bold'}]}>
                  {ESTADO_LABEL[opt]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1.5},
  text: {fontFamily: 'Exo2_700Bold', fontSize: 11},
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center'},
  menu: {backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', minWidth: 140, shadowColor: '#000', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8},
  menuItem: {padding: Spacing.md},
  menuText: {fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular'},
});

function TarefaCard({t, onEstadoChange, canEdit}: {t: TarefaMontagem; onEstadoChange: (id: number, e: TarefaEstado) => void; canEdit: boolean}) {
  const b = BADGE[t.estado] ?? BADGE.pendente;
  return (
    <View style={[cardStyles.card, {borderLeftColor: b.border}]}>
      <View style={cardStyles.body}>
        <View style={{flex: 1, minWidth: 0}}>
          <Text style={cardStyles.titulo}>{t.titulo}</Text>
          {!!t.ordemReferencia && (
            <Text style={cardStyles.op}>OP {t.ordemReferencia}{t.ordemNome ? ` · ${t.ordemNome}` : ''}</Text>
          )}
          {!!t.cliente && <Text style={cardStyles.cliente}>{t.cliente}</Text>}
          {!!t.descricao && <Text style={cardStyles.descricao}>{t.descricao}</Text>}
          {!!t.dataPrevista && (
            <Text style={cardStyles.data}>Previsto: {t.dataPrevista.split('T')[0].split('-').reverse().join('/')}</Text>
          )}
          {!!t.observacoes && <Text style={cardStyles.obs}>{t.observacoes}</Text>}
        </View>
        <EstadoBadge estado={t.estado} onChange={e => onEstadoChange(t.id, e)} canEdit={canEdit} />
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {backgroundColor: '#fff', borderRadius: 12, borderLeftWidth: 4, padding: Spacing.md, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2},
  body: {flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start'},
  titulo: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, color: Colors.gray900, marginBottom: 2},
  op: {fontSize: 12, color: NAVY, fontFamily: 'Exo2_600SemiBold', marginBottom: 1},
  cliente: {fontSize: 12, color: Colors.gray600, fontFamily: 'Exo2_400Regular', marginBottom: 2},
  descricao: {fontSize: 11, color: Colors.gray500, fontFamily: 'Exo2_400Regular', marginBottom: 2},
  data: {fontSize: 11, color: ORANGE, fontFamily: 'Exo2_600SemiBold', marginBottom: 2},
  obs: {fontSize: 11, color: Colors.gray400, fontStyle: 'italic'},
});

export const ConsultarMontagensScreen: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);
  const canEdit = ['montagem', 'direcao'].includes(user?.perfil ?? '');

  const [tarefas, setTarefas]       = useState<TarefaMontagem[]>([]);
  const [isLoading, setIsLoading]   = useState(false);

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await montagensApi.getAll();
      setTarefas(data);
    } catch (e) {
      console.error('Erro ao carregar tarefas de montagem:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleEstadoChange = async (id: number, estado: TarefaEstado) => {
    try {
      await montagensApi.updateEstado(id, estado);
      setTarefas(prev => prev.map(t => t.id === id ? {...t, estado} : t));
    } catch (e) {
      console.error('Erro ao atualizar estado:', e);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        section="MONTAGEM"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      <View style={styles.topBar}>
        <Text style={styles.count}>{tarefas.length} TAREFAS DE MONTAGEM</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />}>

        {isLoading && tarefas.length === 0 && (
          <View style={{paddingTop: 40, alignItems: 'center'}}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
        {!isLoading && tarefas.length === 0 && (
          <View style={{paddingTop: 40, alignItems: 'center'}}>
            <Text style={{color: Colors.gray400, fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular'}}>Sem tarefas de montagem.</Text>
          </View>
        )}
        {tarefas.map(t => (
          <TarefaCard key={t.id} t={t} onEstadoChange={handleEstadoChange} canEdit={canEdit} />
        ))}
      </ScrollView>

      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  topBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border},
  count: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1, color: Colors.gray700},
  scroll: {flex: 1},
  scrollContent: {padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl']},
});
