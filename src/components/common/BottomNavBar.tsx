import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useRouter} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Home, ChevronLeft} from 'lucide-react-native';
import {Colors, Spacing} from '../../theme';

const ORANGE = '#ff7700';
const NAVY   = '#0d1b4b';

interface BottomNavBarProps {
  label?: string;
  onPress?: () => void;
  isHome?: boolean; // desativa VOLTAR quando já estamos na raiz
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({onPress, isHome = false}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleHome = () => {
    if (onPress) onPress();
    else router.navigate('/(tabs)' as any);
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    // sem fallback — se não há histórico, fica no ecrã atual
  };

  return (
    <View style={[styles.container, {paddingBottom: insets.bottom || Spacing.md}]}>
      {/* INÍCIO — always active */}
      <TouchableOpacity style={styles.homeBtn} onPress={handleHome} activeOpacity={0.82}>
        <Home size={26} color="#fff" strokeWidth={2.5} />
        <Text style={styles.homeBtnText}>INÍCIO</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* VOLTAR — disabled when isHome */}
      <TouchableOpacity
        style={[styles.backBtn, isHome && styles.backBtnDisabled]}
        onPress={isHome ? undefined : handleBack}
        activeOpacity={isHome ? 1 : 0.82}
        disabled={isHome}>
        <ChevronLeft size={26} color={isHome ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.75)'} strokeWidth={2.5} />
        <Text style={[styles.backBtnText, isHome && styles.backBtnTextDisabled]}>VOLTAR</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    borderTopWidth: 3,
    borderTopColor: ORANGE,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  homeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xs,
  },
  homeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Exo2_700Bold',
    letterSpacing: 1.5,
  },
  backBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backBtnDisabled: {
    borderColor: 'rgba(255,255,255,0.06)',
  },
  backBtnText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontFamily: 'Exo2_700Bold',
    letterSpacing: 1.5,
  },
  backBtnTextDisabled: {
    color: 'rgba(255,255,255,0.25)',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: Spacing.xs,
  },
});
