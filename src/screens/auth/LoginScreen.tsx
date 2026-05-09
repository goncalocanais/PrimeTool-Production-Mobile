import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import {useAppDispatch, useAppSelector} from '../../store';
import {login, clearError} from '../../store/slices/authSlice';
import {Button, Input} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';

const {height} = Dimensions.get('window');

// ─── Logo PrimeTool em componentes nativos ─────────────────────────────────────
const PrimeToolLogo: React.FC = () => (
  <View style={logo.container}>
    {/* Ícone */}
    <View style={logo.iconWrap}>
      <View style={logo.iconInner}>
        <Text style={logo.iconText}>⚙</Text>
      </View>
      {/* Pixel accent */}
      <View style={logo.pixelTL} />
      <View style={logo.pixelTR} />
    </View>
    {/* Texto */}
    <View>
      <Text style={logo.brandRow}>
        <Text style={logo.prime}>Prime</Text>
        <Text style={logo.tool}>Tool</Text>
      </Text>
      <Text style={logo.sub}>PRODUCTION</Text>
    </View>
  </View>
);

const logo = StyleSheet.create({
  container: {flexDirection: 'row', alignItems: 'center', gap: 14},
  iconWrap: {position: 'relative', width: 60, height: 60},
  iconInner: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {fontSize: 30, color: Colors.white},
  pixelTL: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 2,
  },
  pixelTR: {
    position: 'absolute',
    top: -3,
    right: 9,
    width: 5,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 1,
  },
  brandRow: {},
  prime: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold as any,
    color: Colors.white,
  },
  tool: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.extrabold as any,
    color: Colors.primaryLight,
  },
  sub: {
    fontSize: 10,
    fontWeight: FontWeight.semibold as any,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 4,
    marginTop: 2,
  },
});

// ─── Login Screen ──────────────────────────────────────────────────────────────
export const LoginScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const {isLoading, error} = useAppSelector(s => s.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Animação de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {toValue: 1, duration: 600, useNativeDriver: true}),
      Animated.timing(slideAnim, {toValue: 0, duration: 600, useNativeDriver: true}),
    ]).start();
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    if (!email.trim()) {
      setEmailError('O email é obrigatório');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email inválido');
      valid = false;
    }
    if (!password) {
      setPasswordError('A palavra-passe é obrigatória');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Mínimo de 6 caracteres');
      valid = false;
    }
    return valid;
  };

  const handleLogin = () => {
    if (!validate()) return;
    dispatch(login({email: email.trim().toLowerCase(), password}));
  };

  const clearFieldError = (field: 'email' | 'password') => {
    if (error) dispatch(clearError());
    if (field === 'email') setEmailError('');
    else setPasswordError('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar backgroundColor={Colors.primary} barStyle="light-content" />

      {/* Header azul escuro */}
      <View style={styles.header}>
        {/* Círculos decorativos */}
        <View style={styles.circleTopRight} />
        <View style={styles.circleBottomLeft} />

        <Animated.View style={[styles.headerContent, {opacity: fadeAnim}]}>
          <PrimeToolLogo />
          <Text style={styles.tagline}>Sistema de Gestão Industrial</Text>
        </Animated.View>
      </View>

      {/* Card do formulário */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <Animated.View
          style={[
            styles.formCard,
            {opacity: fadeAnim, transform: [{translateY: slideAnim}]},
          ]}>
          <Text style={styles.formTitle}>Iniciar Sessão</Text>
          <Text style={styles.formSub}>Aceda ao sistema com as suas credenciais</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxIcon}>⚠️</Text>
              <Text style={styles.errorBoxText}>{error}</Text>
            </View>
          )}

          <Input
            label="Email"
            placeholder="utilizador@empresa.pt"
            value={email}
            onChangeText={text => {
              setEmail(text);
              clearFieldError('email');
            }}
            error={emailError}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />

          <Input
            label="Palavra-passe"
            placeholder="••••••••"
            value={password}
            onChangeText={text => {
              setPassword(text);
              clearFieldError('password');
            }}
            error={passwordError}
            isPassword
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <Button
            label={isLoading ? 'A entrar...' : 'Entrar'}
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            size="lg"
            style={styles.loginBtn}
          />

          <TouchableOpacity style={styles.forgotWrap}>
            <Text style={styles.forgotText}>Esqueceu a palavra-passe?</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Rodapé */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>PrimeTool Production v1.0.0</Text>
          <Text style={styles.footerSub}>© 2026 PrimeTool · Todos os direitos reservados</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const HEADER_HEIGHT = height * 0.38;

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: Colors.background},

  // Header
  header: {
    backgroundColor: Colors.primary,
    height: HEADER_HEIGHT,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circleTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(4,148,253,0.15)',
  },
  headerContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  tagline: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: FontSize.sm,
    marginTop: Spacing.xs,
    marginLeft: 74, // alinha com texto depois do ícone
  },

  // Scroll / form
  scrollContent: {flexGrow: 1},
  formCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    marginTop: -28,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  formTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold as any,
    color: Colors.gray900,
    marginBottom: 4,
  },
  formSub: {
    fontSize: FontSize.sm,
    color: Colors.gray500,
    marginBottom: Spacing.xl,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
    gap: Spacing.sm,
  },
  errorBoxIcon: {fontSize: 16},
  errorBoxText: {
    flex: 1,
    color: Colors.danger,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium as any,
  },
  loginBtn: {marginTop: Spacing.sm},
  forgotWrap: {alignItems: 'center', marginTop: Spacing.base, paddingVertical: Spacing.xs},
  forgotText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium as any,
  },

  // Footer
  footer: {alignItems: 'center', padding: Spacing.xl, gap: 4},
  footerText: {fontSize: FontSize.xs, color: Colors.gray400, fontWeight: FontWeight.medium as any},
  footerSub: {fontSize: FontSize.xs, color: Colors.gray300},
});
