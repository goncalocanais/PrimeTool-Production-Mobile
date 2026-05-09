import React, {useState, useRef} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
} from 'react-native';
import {useRouter} from 'expo-router';
import {ChevronDown} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;

type Estado = 'Pendente' | 'Em Trânsito' | 'Entregue' | 'Cancelado';

interface Guia {
  id: string;
  obra: string;
  cliente: string;
  veiculo: string;
  motorista: string;
  morada: string;
  criadoEm: string;
  entregueEm?: string;
  estado: Estado;
}

const ESTADOS: Estado[] = ['Pendente', 'Em Trânsito', 'Entregue', 'Cancelado'];

const ESTADO_STYLE: Record<Estado, {bg: string; text: string}> = {
  'Pendente':    {bg: '#fff3e0', text: '#e65100'},
  'Em Trânsito': {bg: '#e0f2fe', text: '#0277bd'},
  'Entregue':    {bg: '#e8f5e9', text: '#2e7d32'},
  'Cancelado':   {bg: '#fce4ec', text: '#c62828'},
};

const INITIAL_GUIAS: Guia[] = [
  {id: 'GT001', obra: 'Obra 1003', cliente: 'Indústrias Ferreira SA',    veiculo: 'Ford Transit (AA-00-BB)',        motorista: 'Rui Monteiro',    morada: 'Rua Industrial, 45, Braga',         criadoEm: '2025-02-10', entregueEm: '2025-02-12', estado: 'Entregue'},
  {id: 'GT002', obra: 'Obra 1005', cliente: 'TechBuild Construções',     veiculo: 'Mercedes Sprinter (CC-11-DD)',   motorista: 'Manuel Oliveira', morada: 'Avenida da República, 120, Porto',  criadoEm: '2025-02-26', entregueEm: '2025-02-28', estado: 'Entregue'},
  {id: 'GT003', obra: 'Obra 1001', cliente: 'Metalúrgica Silva Lda',     veiculo: 'Iveco Daily (EE-22-FF)',         motorista: 'Rui Monteiro',    morada: 'Zona Industrial Norte, Guimarães',  criadoEm: '2025-03-04', estado: 'Em Trânsito'},
  {id: 'GT004', obra: 'Obra 1004', cliente: 'Logística Rápida Lda',      veiculo: 'Ford Transit (AA-00-BB)',        motorista: 'Rui Monteiro',    morada: 'Parque Logístico, Matosinhos',      criadoEm: '2025-03-05', estado: 'Pendente'},
];

/* ── Estado badge with dropdown ── */
function EstadoBadge({estado, onChange}: {estado: Estado; onChange: (e: Estado) => void}) {
  const [open, setOpen] = useState(false);
  const style = ESTADO_STYLE[estado];

  return (
    <View>
      <TouchableOpacity
        style={[badgeStyles.badge, {backgroundColor: style.bg}]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}>
        <Text style={[badgeStyles.text, {color: style.text}]}>{estado}</Text>
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
                  <Text style={[badgeStyles.menuText, {color: s.text}, e === estado && {fontFamily: 'Exo2_700Bold'}]}>{e}</Text>
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
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  text: {fontFamily: 'Exo2_700Bold', fontSize: 11},
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center'},
  menu: {
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', minWidth: 160,
    ...{shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8},
  },
  menuItem: {flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.md},
  dot: {width: 8, height: 8, borderRadius: 4, flexShrink: 0},
  menuText: {fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular'},
});

/* ── Guia Card ── */
function GuiaCard({guia, onEstadoChange}: {guia: Guia; onEstadoChange: (id: string, e: Estado) => void}) {
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.topRow}>
        <View style={{flex: 1, minWidth: 0}}>
          <View style={cardStyles.idRow}>
            <Text style={cardStyles.id}>{guia.id}</Text>
            <Text style={cardStyles.dot}>·</Text>
            <Text style={cardStyles.obra}>{guia.obra}</Text>
          </View>
          <Text style={cardStyles.cliente}>{guia.cliente}</Text>
          <Text style={cardStyles.veiculo}>{guia.veiculo} · {guia.motorista}</Text>
          <Text style={cardStyles.morada}>{guia.morada}</Text>
        </View>

        <View style={cardStyles.rightCol}>
          <Text style={cardStyles.date}>Criado: {guia.criadoEm}</Text>
          {guia.entregueEm && <Text style={cardStyles.date}>Entregue: {guia.entregueEm}</Text>}
          <EstadoBadge estado={guia.estado} onChange={e => onEstadoChange(guia.id, e)} />
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
  },
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

/* ── Main Screen ── */
export const AtualizarEstadoExpedicaoScreen: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);
  const [guias, setGuias] = useState<Guia[]>(INITIAL_GUIAS);

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const handleEstadoChange = (id: string, novoEstado: Estado) => {
    setGuias(prev => prev.map(g => {
      if (g.id !== id) return g;
      const hoje = new Date().toISOString().split('T')[0];
      return {...g, estado: novoEstado, entregueEm: novoEstado === 'Entregue' ? hoje : g.entregueEm};
    }));
  };

  return (
    <View style={styles.container}>
      <AppHeader
        section="EXPEDIÇÃO"
        subtitle="ATUALIZAR ESTADO"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>GUIAS DE TRANSPORTE</Text>
        {guias.map(g => (
          <GuiaCard key={g.id} guia={g} onEstadoChange={handleEstadoChange} />
        ))}
        <Text style={styles.hint}>Toque no estado para alterar.</Text>
      </ScrollView>

      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  scroll: {flex: 1},
  scrollContent: {padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl']},
  sectionTitle: {
    fontFamily: 'Exo2_800ExtraBold', fontSize: 12,
    letterSpacing: 3, color: NAVY, marginBottom: Spacing.sm,
  },
  hint: {textAlign: 'center', fontSize: 12, color: Colors.gray400, marginTop: Spacing.md},
});
