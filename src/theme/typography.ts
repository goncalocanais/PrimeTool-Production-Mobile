import {TextStyle} from 'react-native';

// Família: Exo 2 (carregada via expo-font ou @expo-google-fonts/exo-2)
// Fallback: System font se Exo 2 não estiver carregada
export const FontFamily = {
  regular: 'Exo2_400Regular',
  semibold: 'Exo2_600SemiBold',
  bold: 'Exo2_700Bold',
  extrabold: 'Exo2_800ExtraBold',
  black: 'Exo2_900Black',
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
};

export const FontWeight: Record<string, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

export const LetterSpacing = {
  tight: 0.5,
  normal: 1,
  wide: 1.5,
  wider: 2,
};

export const Typography = {
  h1: {fontSize: FontSize['3xl'], fontWeight: FontWeight.bold, letterSpacing: LetterSpacing.tight} as TextStyle,
  h2: {fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, letterSpacing: LetterSpacing.tight} as TextStyle,
  h3: {fontSize: FontSize.xl, fontWeight: FontWeight.semibold, letterSpacing: LetterSpacing.tight} as TextStyle,
  h4: {fontSize: FontSize.lg, fontWeight: FontWeight.semibold} as TextStyle,
  h5: {fontSize: FontSize.md, fontWeight: FontWeight.semibold} as TextStyle,
  body: {fontSize: FontSize.base, fontWeight: FontWeight.regular, lineHeight: FontSize.base * 1.5} as TextStyle,
  bodyMedium: {fontSize: FontSize.base, fontWeight: FontWeight.medium} as TextStyle,
  small: {fontSize: FontSize.sm, fontWeight: FontWeight.regular, lineHeight: FontSize.sm * 1.3} as TextStyle,
  smallMedium: {fontSize: FontSize.sm, fontWeight: FontWeight.medium} as TextStyle,
  caption: {fontSize: FontSize.xs, fontWeight: FontWeight.regular, letterSpacing: LetterSpacing.normal} as TextStyle,
  label: {fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: LetterSpacing.wide} as TextStyle,
};
