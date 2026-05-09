import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useRouter} from 'expo-router';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';

const MODULE_BLUE = Colors.primaryLight;

export const QualityHubScreen: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const buttons = [
    {label: 'VERIFICAR ORDENS DE PRODUÇÃO', route: '/(tabs)/orders'},
    {label: 'CONSULTAR VERIFICAÇÕES',       route: '/quality/verificacoes'},
  ];

  return (
    <View style={styles.container}>
      <AppHeader
        section="QUALIDADE"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />
      <View style={styles.content}>
        {buttons.map((btn, i) => (
          <TouchableOpacity
            key={i}
            style={styles.btn}
            onPress={() => router.push(btn.route as any)}
            activeOpacity={0.85}>
            <Text style={styles.btnText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  content: {
    flex: 1,
    padding: Spacing.xl,
    gap: Spacing.md,
    justifyContent: 'center',
  },
  btn: {
    backgroundColor: MODULE_BLUE,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
  },
  btnText: {
    color: Colors.white,
    fontFamily: 'Exo2_700Bold',
    fontSize: FontSize.base,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
