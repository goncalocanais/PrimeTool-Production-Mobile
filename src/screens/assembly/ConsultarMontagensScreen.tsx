import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
} from 'react-native';
import {useRouter} from 'expo-router';
import {MapPin, Plus, ChevronDown} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;

type Estado = 'Agendada' | 'Em Curso' | 'Concluída' | 'Suspensa';

const ESTADOS: Estado[] = ['Agendada', 'Em Curso', 'Concluída', 'Suspensa'];

const BADGE: Record<Estado, {bg: string; color: string; border: string}> = {
  'Agendada':  {bg: '#e0f2fe', color: '#0369a1', border: '#0369a1'},
  'Em Curso':  {bg: '#fff7ed', color: '#c2410c', border: '#c2410c'},
  'Concluída': {bg: '#dcfce7', color: '#15803d', border: '#15803d'},
  'Suspensa':  {bg: '#f3f4f6', color: '#6b7280', border: '#6b7280'},
};

interface Montagem {
  id: string;
  obra: string;
  cliente: string;
  local: string;
  tecnico: string;
  data: string;
  observacoes: string;
  estado: Estado;
}

const MOCK_MONTAGENS: Montagem[] = [
  {id: '1', obra: 'Obra 1001', cliente: 'Metalúrgica Silva Lda',  local: 'Rua Industrial, 45, Braga',         tecnico: 'Pedro Santos', data: '2025-03-15', observacoes: 'Montagem de estrutura metálica principal.', estado: 'Agendada'},
  {id: '2', obra: 'Obra 1004', cliente: 'Logística Rápida Lda',   local: 'Parque Logístico, Matosinhos',       tecnico: 'Pedro Santos', data: '2025-03-10', observacoes: 'Montagem de estantes – zona B concluída.',    estado: 'Em Curso'},
  {id: '3', obra: 'Obra 1003', cliente: 'Indústrias Ferreira SA',  local: 'Rua do Parque, 12, Famalicão',      tecnico: 'Pedro Santos', data: '2025-02-20', observacoes: 'Instalação concluída com sucesso.',           estado: 'Concluída'},
];

/* ── Badge com dropdown ── */
function EstadoBadge({estado, onChange}: {estado: Estado; onChange: (e: Estado) => void}) {
  const [open, setOpen] = useState(false);
  const b = BADGE[estado];

  return (
    <View>
      <TouchableOpacity
        style={[badgeStyles.badge, {backgroundColor: b.bg, borderColor: b.border}]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}>
        <Text style={[badgeStyles.text, {color: b.color}]}>{estado}</Text>
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
                  {opt}
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
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BorderRadius.full, borderWidth: 1.5,
  },
  text: {fontFamily: 'Exo2_700Bold', fontSize: 11},
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center'},
  menu: {
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', minWidth: 140,
    shadowColor: '#000', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8,
  },
  menuItem: {padding: Spacing.md},
  menuText: {fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular'},
});

/* ── Montagem Card ── */
function MontagemCard({m, onEstadoChange}: {m: Montagem; onEstadoChange: (id: string, e: Estado) => void}) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.body}>
        <View style={{flex: 1, minWidth: 0}}>
          <View style={cardStyles.titleRow}>
            <Text style={cardStyles.obra}>{m.obra}</Text>
            <Text style={cardStyles.sep}>·</Text>
            <Text style={cardStyles.cliente}>{m.cliente}</Text>
          </View>

          <View style={cardStyles.localRow}>
            <MapPin size={12} color={ORANGE} />
            <Text style={cardStyles.local}>{m.local}</Text>
          </View>

          <Text style={cardStyles.tecnico}>
            Técnico: <Text style={cardStyles.tecnicoName}>{m.tecnico}</Text>
            {'  ·  '}{m.data}
          </Text>

          <Text style={cardStyles.obs}>{m.observacoes}</Text>
        </View>

        <EstadoBadge estado={m.estado} onChange={e => onEstadoChange(m.id, e)} />
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border,
    padding: Spacing.md,
  },
  body: {flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start'},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4},
  obra: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, color: Colors.gray900},
  sep: {color: Colors.gray400, fontSize: FontSize.sm},
  cliente: {fontFamily: 'Exo2_600SemiBold', fontSize: FontSize.sm, color: Colors.gray700},
  localRow: {flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2},
  local: {fontSize: 12, color: Colors.primaryLight},
  tecnico: {fontSize: 12, color: Colors.gray600, marginBottom: 4},
  tecnicoName: {color: Colors.gray700, fontFamily: 'Exo2_600SemiBold'},
  obs: {fontSize: 11, color: Colors.gray400, fontStyle: 'italic'},
});

/* ── Main Screen ── */
export const ConsultarMontagensScreen: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);
  const [montagens, setMontagens] = useState<Montagem[]>(MOCK_MONTAGENS);

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const handleEstadoChange = (id: string, estado: Estado) =>
    setMontagens(prev => prev.map(m => m.id === id ? {...m, estado} : m));

  return (
    <View style={styles.container}>
      <AppHeader
        section="MONTAGEM"
        subtitle="CONSULTAR MONTAGENS"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      <View style={styles.topBar}>
        <Text style={styles.count}>{montagens.length} MONTAGENS</Text>
        <TouchableOpacity style={styles.newBtn} activeOpacity={0.85} onPress={() => router.push('/assembly/registar')}>
          <Plus size={15} color="#fff" strokeWidth={3} />
          <Text style={styles.newBtnText}>REGISTAR</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {montagens.map(m => (
          <MontagemCard key={m.id} m={m} onEstadoChange={handleEstadoChange} />
        ))}
      </ScrollView>

      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  count: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1, color: Colors.gray700},
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.success, paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.full,
  },
  newBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1},
  scroll: {flex: 1},
  scrollContent: {padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl']},
});
