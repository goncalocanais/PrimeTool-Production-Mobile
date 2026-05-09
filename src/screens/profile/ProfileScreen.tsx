import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {useRouter} from 'expo-router';
import {LogOut, Mail, Building2, Briefcase, Shield} from 'lucide-react-native';
import {useAppDispatch, useAppSelector} from '../../store';
import {logout} from '../../store/slices/authSlice';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;

const PERFIL_LABELS: Record<string, string> = {
  direcao:    'Direção e Administração',
  rh:         'Recursos Humanos',
  planeamento:'Planeamento',
  armazem:    'Armazém',
  producao:   'Produção',
  qualidade:  'Qualidade',
  expedicao:  'Expedição',
  montagem:   'Montagem',
};

const PERFIL_COLORS: Record<string, string> = {
  direcao:    NAVY,
  rh:         '#8b5cf6',
  planeamento:Colors.primaryLight,
  armazem:    '#eab308',
  producao:   '#3b82f6',
  qualidade:  Colors.success,
  expedicao:  ORANGE,
  montagem:   Colors.danger,
};

export const ProfileScreen: React.FC = () => {
  const router   = useRouter();
  const dispatch = useAppDispatch();
  const user     = useAppSelector(s => s.auth.user);

  const perfil = user?.perfil ?? 'producao';
  const cor    = PERFIL_COLORS[perfil] ?? NAVY;

  const getInitials = () => {
    if (!user) return '?';
    const parts = user.nome.split(' ');
    return parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : user.nome.slice(0, 2).toUpperCase();
  };

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const handleLogout = () => {
    Alert.alert(
      'Terminar Sessão',
      'Tem a certeza que pretende terminar a sessão?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {text: 'Terminar', style: 'destructive', onPress: () => dispatch(logout())},
      ],
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        section="PERFIL"
        userName={getDisplayName()}
        onLogoPress={() => router.push('/(tabs)')}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, {backgroundColor: cor}]}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <Text style={styles.nome}>{user?.nome}</Text>
          <Text style={styles.cargo}>{user?.cargo}</Text>
          <View style={[styles.perfilBadge, {backgroundColor: cor + '18', borderColor: cor + '40'}]}>
            <Text style={[styles.perfilText, {color: cor}]}>{PERFIL_LABELS[perfil] ?? perfil}</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>INFORMAÇÃO</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><Mail size={15} color={Colors.primaryLight} /></View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>EMAIL</Text>
              <Text style={styles.infoValue}>{user?.email ?? '—'}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><Building2 size={15} color={Colors.primaryLight} /></View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>DEPARTAMENTO</Text>
              <Text style={styles.infoValue}>{user?.departamento ?? '—'}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><Briefcase size={15} color={Colors.primaryLight} /></View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>CARGO</Text>
              <Text style={styles.infoValue}>{user?.cargo ?? '—'}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}><Shield size={15} color={Colors.primaryLight} /></View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>PERFIL DE ACESSO</Text>
              <Text style={styles.infoValue}>{PERFIL_LABELS[perfil] ?? perfil}</Text>
            </View>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={18} color="#fff" strokeWidth={2.5} />
          <Text style={styles.logoutText}>TERMINAR SESSÃO</Text>
        </TouchableOpacity>

        <Text style={styles.version}>PrimeTool Mobile v1.0</Text>
      </ScrollView>

      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  content: {padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl']},

  avatarSection: {alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.sm},
  avatarCircle: {width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4},
  avatarText: {fontFamily: 'Exo2_700Bold', fontSize: 28, color: '#fff'},
  nome: {fontFamily: 'Exo2_700Bold', fontSize: 18, color: Colors.gray900},
  cargo: {fontSize: FontSize.sm, color: Colors.gray500, fontFamily: 'Exo2_400Regular'},
  perfilBadge: {borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 5, marginTop: 4},
  perfilText: {fontSize: 11, fontFamily: 'Exo2_700Bold', letterSpacing: 0.5},

  card: {backgroundColor: '#fff', borderRadius: 12, padding: Spacing.md, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2, gap: Spacing.sm},
  cardTitle: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 1.5, marginBottom: 4},
  infoRow: {flexDirection: 'row', alignItems: 'center', gap: Spacing.md},
  infoIcon: {width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.primaryUltraLight, alignItems: 'center', justifyContent: 'center'},
  infoContent: {flex: 1},
  infoLabel: {fontSize: 9, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 0.8},
  infoValue: {fontSize: FontSize.sm, fontFamily: 'Exo2_600SemiBold', color: Colors.gray900, marginTop: 1},
  separator: {height: 1, backgroundColor: Colors.gray50},

  logoutBtn: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.danger, borderRadius: BorderRadius.full, paddingVertical: 14},
  logoutText: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, color: '#fff', letterSpacing: 1},

  version: {textAlign: 'center', fontSize: 11, color: Colors.gray400, fontFamily: 'Exo2_400Regular'},
});
