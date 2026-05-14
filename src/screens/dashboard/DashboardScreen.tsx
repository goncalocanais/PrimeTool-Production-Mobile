import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import {useRouter} from 'expo-router';
import {
  CalendarClock, Cog, ShieldCheck, Truck, Wrench,
  Package, ClipboardList, RefreshCw, PenLine, CheckSquare2,
} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';
import {UserRole} from '../../types';
import {AppHeader, BottomNavBar} from '../../components/common';

const ORANGE = '#ff7700';
const NAVY   = '#0d1b4b';
const BLUE   = '#0094ff';

interface Module {
  name: string;
  tab: string;
  roles: UserRole[];
  Icon: React.FC<{size: number; color: string; strokeWidth?: number}>;
}

const ALL_MODULES: Module[] = [
  {name: 'PLANEAMENTO',       tab: '/planeamento',                 roles: ['direcao', 'planeamento'],         Icon: CalendarClock},
  {name: 'PRODUÇÃO',          tab: '/(tabs)/orders',               roles: ['direcao', 'producao'],            Icon: Cog},
  {name: 'QUALIDADE',         tab: '/quality',                     roles: ['direcao', 'qualidade'],           Icon: ShieldCheck},
  {name: 'EXPEDIÇÃO',         tab: '/expedition/atualizar-estado', roles: ['direcao', 'expedicao'],           Icon: Truck},
  {name: 'MONTAGEM',          tab: '/assembly/montagens',          roles: ['direcao', 'montagem'],            Icon: Wrench},
  {name: 'INVENTÁRIO',        tab: '/(tabs)/materials',            roles: ['direcao', 'armazem', 'producao'], Icon: Package},
];

const ROLE_LABELS: Record<UserRole, string> = {
  direcao:     'Direção',
  planeamento: 'Planeamento',
  armazem:     'Armazém',
  producao:    'Produção',
  qualidade:   'Qualidade',
  expedicao:   'Expedição',
  montagem:    'Montagem',
};

const SIMPLE_HOME_ROLES: UserRole[] = ['producao', 'montagem', 'qualidade', 'expedicao', 'armazem', 'planeamento'];

interface SimpleButton {
  label: string;
  route: string;
  Icon: React.FC<{size: number; color: string; strokeWidth?: number}>;
  primary?: boolean;
}

const SIMPLE_BUTTONS: Record<UserRole, SimpleButton[]> = {
  producao: [
    {label: 'CONSULTAR ORDENS DE PRODUÇÃO', route: '/(tabs)/orders',           Icon: ClipboardList, primary: true},
    {label: 'ATUALIZAR ESTADO DA OBRA',     route: '/production/estado-obra',  Icon: RefreshCw},
  ],
  montagem: [
    {label: 'CONSULTAR ORDENS DE MONTAGEM', route: '/assembly/montagens',      Icon: ClipboardList, primary: true},
    {label: 'REGISTAR MONTAGEM',            route: '/assembly/registar',       Icon: PenLine},
  ],
  qualidade: [
    {label: 'VERIFICAR ORDENS DE PRODUÇÃO', route: '/(tabs)/orders',           Icon: ShieldCheck,   primary: true},
    {label: 'CONSULTAR VERIFICAÇÕES',       route: '/quality/verificacoes',    Icon: CheckSquare2},
  ],
  expedicao: [
    {label: 'GUIAS DE TRANSPORTE',          route: '/expedition/atualizar-estado', Icon: Truck,     primary: true},
  ],
  armazem: [
    {label: 'INVENTÁRIO E PEDIDOS',         route: '/(tabs)/materials',        Icon: Package,       primary: true},
  ],
  planeamento: [
    {label: 'CONSULTAR ORDENS DE PRODUÇÃO', route: '/planeamento',             Icon: CalendarClock, primary: true},
  ],
  direcao: [],
};

export const DashboardScreen: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);
  const role = (user?.perfil ?? 'producao') as UserRole;

  const visibleModules = ALL_MODULES.filter(m => m.roles.includes(role));
  const isSimpleHome = SIMPLE_HOME_ROLES.includes(role);

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const rawFirst = user?.nome?.split(' ')[0] ?? '';
  const firstName = user?.nome?.includes(' ') ? rawFirst : (ROLE_LABELS[role] ?? (rawFirst || 'Utilizador'));

  const renderHeader = () => (
    <AppHeader
      section="INÍCIO"
      userName={getDisplayName()}
      onUserPress={() => router.push('/(tabs)/profile')}
      onLogoPress={() => router.push('/(tabs)')}
    />
  );

  // Simple home for operational profiles
  if (isSimpleHome) {
    const buttons = SIMPLE_BUTTONS[role] ?? [];
    return (
      <View style={styles.container}>
        {renderHeader()}

        <View style={styles.welcomeBar}>
          <Text style={styles.welcomeText}>Olá, {firstName}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{ROLE_LABELS[role]}</Text>
          </View>
        </View>

        <View style={styles.simpleContent}>
          {buttons.map((btn, i) => {
            const BtnIcon = btn.Icon;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.simpleBtn, btn.primary ? styles.simpleBtnPrimary : styles.simpleBtnSecondary]}
                onPress={() => router.push(btn.route as any)}
                activeOpacity={0.85}>
                <BtnIcon size={28} color="#fff" strokeWidth={2} />
                <Text style={styles.simpleBtnText}>{btn.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <BottomNavBar isHome />
      </View>
    );
  }

  // Admin / direcao — 2-column icon grid
  const padded = [...visibleModules];
  if (padded.length % 2 !== 0) padded.push(null as any);

  return (
    <View style={styles.container}>
      {renderHeader()}

      <View style={styles.welcomeBar}>
        <Text style={styles.welcomeText}>Olá, {firstName}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>{ROLE_LABELS[role]}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>MÓDULOS</Text>
        <View style={styles.grid}>
          {padded.map((mod, i) =>
            mod ? (
              <TouchableOpacity
                key={i}
                style={styles.moduleCard}
                onPress={() => router.push(mod.tab as any)}
                activeOpacity={0.8}>
                <View style={styles.moduleIconWrap}>
                  <mod.Icon size={32} color={ORANGE} strokeWidth={1.8} />
                </View>
                <Text style={styles.moduleText}>{mod.name}</Text>
              </TouchableOpacity>
            ) : (
              <View key={`empty-${i}`} style={styles.moduleCardEmpty} />
            )
          )}
        </View>

        {role === 'direcao' && (
          <TouchableOpacity style={styles.adminBtn} activeOpacity={0.8} onPress={() => router.push('/admin')}>
            <Text style={styles.adminBtnText}>ADMIN</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <BottomNavBar isHome />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},

  // Welcome bar
  welcomeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  welcomeText: {
    fontSize: FontSize.md,
    fontFamily: 'Exo2_700Bold',
    color: NAVY,
  },
  rolePill: {
    backgroundColor: Colors.gray50,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  roleText: {
    fontSize: FontSize.xs,
    fontFamily: 'Exo2_700Bold',
    color: Colors.gray600,
    letterSpacing: 1,
  },

  // Scroll
  scroll: {
    padding: Spacing.base,
    paddingBottom: Spacing['3xl'],
  },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontFamily: 'Exo2_700Bold',
    color: Colors.gray500,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },

  // 2-column grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  moduleCard: {
    width: '47.5%',
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: ORANGE,
    // shadow
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    minHeight: 110,
  },
  moduleCardEmpty: {
    width: '47.5%',
  },
  moduleIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gray50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  moduleText: {
    color: NAVY,
    fontSize: FontSize.sm,
    fontFamily: 'Exo2_700Bold',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 18,
  },

  // Simple home
  simpleContent: {
    flex: 1,
    padding: Spacing.xl,
    gap: Spacing.base,
    justifyContent: 'center',
  },
  simpleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    // shadow
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  simpleBtnPrimary: {
    backgroundColor: ORANGE,
  },
  simpleBtnSecondary: {
    backgroundColor: NAVY,
  },
  simpleBtnText: {
    flex: 1,
    color: '#fff',
    fontFamily: 'Exo2_700Bold',
    fontSize: FontSize.base,
    letterSpacing: 0.5,
    lineHeight: 22,
  },

  // Admin button
  adminBtn: {
    marginTop: Spacing.lg,
    backgroundColor: ORANGE,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    alignSelf: 'flex-start',
  },
  adminBtnText: {
    color: '#fff',
    fontFamily: 'Exo2_700Bold',
    fontSize: FontSize.sm,
    letterSpacing: 1,
  },
});
