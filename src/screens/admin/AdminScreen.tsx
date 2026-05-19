import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import {useRouter} from 'expo-router';
import {Database} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';

const NAVY   = Colors.primary;   // #0d1b4b
const ORANGE = Colors.warning;   // #ff7700
const BLUE   = Colors.primaryLight; // #0094ff

/* ── Field ── */
function Field({label, value, onChange}: {label: string; value: string; onChange: (v: string) => void}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={fieldStyles.input}
        placeholderTextColor={Colors.gray400}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: {gap: 4},
  label: {fontSize: 10, fontFamily: 'Exo2_700Bold', letterSpacing: 1.5, color: Colors.gray400},
  input: {
    padding: Spacing.sm + 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    fontSize: FontSize.sm,
    color: Colors.gray900,
    fontFamily: 'Exo2_400Regular',
    backgroundColor: '#fff',
  },
});

/* ── Panel (card with title) ── */
function Panel({title, icon, children}: {title: string; icon: React.ReactNode; children: React.ReactNode}) {
  return (
    <View style={panelStyles.card}>
      <View style={panelStyles.header}>
        {icon}
        <Text style={panelStyles.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const panelStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  header: {flexDirection: 'row', alignItems: 'center', gap: 6},
  title: {fontFamily: 'Exo2_700Bold', fontSize: 11, letterSpacing: 1, color: BLUE},
});

/* ── Save button ── */
function SaveBtn({onPress}: {onPress: () => void}) {
  return (
    <TouchableOpacity style={saveStyles.btn} onPress={onPress} activeOpacity={0.85}>
      <Text style={saveStyles.text}>GUARDAR ALTERAÇÕES</Text>
    </TouchableOpacity>
  );
}

const saveStyles = StyleSheet.create({
  btn: {
    backgroundColor: ORANGE,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 2,
  },
  text: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 10, letterSpacing: 1.5},
});

/* ── Main Screen ── */
export const AdminScreen: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);
  const getDisplayName = () => {
    if (!user) return 'Admin';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const [empresa, setEmpresa] = useState({
    nome: 'PrimeTool Industries Lda',
    nif: '509876543',
    email: 'geral@primetool.pt',
    telefone: '253 000 111',
  });

  return (
    <View style={styles.container}>
      <AppHeader
        section="ADMIN"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Dados da empresa */}
        <Panel title="DADOS DA EMPRESA" icon={<Database size={14} color={BLUE} />}>
          <Field label="NOME DA EMPRESA" value={empresa.nome}     onChange={v => setEmpresa(p => ({...p, nome: v}))} />
          <Field label="NIF"             value={empresa.nif}      onChange={v => setEmpresa(p => ({...p, nif: v}))} />
          <Field label="EMAIL"           value={empresa.email}    onChange={v => setEmpresa(p => ({...p, email: v}))} />
          <Field label="TELEFONE"        value={empresa.telefone} onChange={v => setEmpresa(p => ({...p, telefone: v}))} />
          <SaveBtn onPress={() => {}} />
        </Panel>

      </ScrollView>

      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  scroll: {flex: 1},
  scrollContent: {padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl']},
});
