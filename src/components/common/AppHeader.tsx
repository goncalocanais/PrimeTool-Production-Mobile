import React from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity, StatusBar} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';

const ORANGE = '#ff7700';
const NAVY   = '#0d1b4b';

const logoSrc = require('../../../assets/logo.png');

interface AppHeaderProps {
  section: string;
  subtitle?: string;
  userName: string;
  onUserPress?: () => void;
  onLogoPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  section,
  subtitle,
  userName,
  onUserPress,
  onLogoPress,
}) => {
  const insets = useSafeAreaInsets();
  const initials = userName
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />
      <View style={[styles.container, {paddingTop: insets.top + Spacing.md}]}>

        {/* Logo */}
        <TouchableOpacity style={styles.logoBox} onPress={onLogoPress} activeOpacity={0.85}>
          <Image source={logoSrc} style={styles.logoImg} resizeMode="contain" />
        </TouchableOpacity>

        {/* Centered title */}
        <View style={styles.center}>
          <Text style={styles.section}>{section}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {/* User circle */}
        <TouchableOpacity style={styles.userCircle} onPress={onUserPress} activeOpacity={0.85}>
          <Text style={styles.userInitials}>{initials}</Text>
        </TouchableOpacity>

      </View>

      {/* Orange accent strip */}
      <View style={styles.accentStrip} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: NAVY,
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accentStrip: {
    height: 4,
    backgroundColor: ORANGE,
  },
  logoBox: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: 100,
    height: 34,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  section: {
    color: '#fff',
    fontSize: FontSize.md,
    fontFamily: 'Exo2_700Bold',
    letterSpacing: 3,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: FontSize.xs,
    fontFamily: 'Exo2_400Regular',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  userCircle: {
    backgroundColor: ORANGE,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  userInitials: {
    color: '#fff',
    fontSize: FontSize.base,
    fontFamily: 'Exo2_700Bold',
  },
});
