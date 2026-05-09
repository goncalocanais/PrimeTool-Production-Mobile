import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal} from 'react-native';
import {useRouter} from 'expo-router';
import {Check, X} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar, DateInput} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;
const GREEN  = Colors.success;

export const RegistarMontagemScreen: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);

  const [form, setForm] = useState({
    nObra: '',
    data: '',
    cliente: '',
    local: '',
    morada: '',
    equipa: '',
    observacoes: '',
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const isValid = form.nObra.trim() && form.data.trim() && form.cliente.trim();

  const handleSubmit = () => {
    if (!isValid) return;
    setShowSuccess(true);
  };

  const handleConfirm = () => {
    setShowSuccess(false);
    setForm({nObra: '', data: '', cliente: '', local: '', morada: '', equipa: '', observacoes: ''});
    router.push('/assembly/montagens');
  };

  const fields: {label: string; key: keyof typeof form; placeholder: string; required?: boolean; multiline?: boolean; isDate?: boolean}[] = [
    {label: 'Nº DE OBRA *',         key: 'nObra',        placeholder: '2026-0001', required: true},
    {label: 'DATA DE MONTAGEM *',   key: 'data',         placeholder: '', required: true, isDate: true},
    {label: 'CLIENTE *',            key: 'cliente',      placeholder: 'Nome do cliente', required: true},
    {label: 'LOCAL',                key: 'local',        placeholder: 'Ex: Braga'},
    {label: 'MORADA',               key: 'morada',       placeholder: 'Rua, nº, código postal'},
    {label: 'EQUIPA',               key: 'equipa',       placeholder: 'Nomes dos colaboradores'},
    {label: 'OBSERVAÇÕES',          key: 'observacoes',  placeholder: 'Notas adicionais...', multiline: true},
  ];

  return (
    <View style={styles.container}>
      <AppHeader
        section="MONTAGEM"
        subtitle="REGISTAR MONTAGEM"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/assembly/montagens')}>
          <Text style={styles.breadcrumbLink}>MONTAGEM</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}> › </Text>
        <Text style={styles.breadcrumbCurrent}>REGISTAR MONTAGEM</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>DADOS DA MONTAGEM</Text>
          </View>

          {fields.map(f => (
            <View key={f.key} style={styles.field}>
              <Text style={styles.fieldLabel}>{f.label}</Text>
              {f.isDate ? (
                <DateInput
                  style={styles.input}
                  value={form[f.key]}
                  onChangeText={v => setForm(p => ({...p, [f.key]: v}))}
                />
              ) : (
                <TextInput
                  style={[styles.input, f.multiline && styles.inputMulti]}
                  placeholder={f.placeholder}
                  placeholderTextColor={Colors.gray400}
                  value={form[f.key]}
                  onChangeText={v => setForm(p => ({...p, [f.key]: v}))}
                  multiline={f.multiline}
                  numberOfLines={f.multiline ? 3 : 1}
                  textAlignVertical={f.multiline ? 'top' : 'center'}
                />
              )}
            </View>
          ))}

          <TouchableOpacity
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid}
            activeOpacity={0.85}>
            <Text style={styles.submitBtnText}>REGISTAR MONTAGEM</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNavBar />

      {/* Success modal */}
      <Modal visible={showSuccess} transparent animationType="fade" onRequestClose={() => setShowSuccess(false)}>
        <View style={styles.overlay}>
          <View style={styles.successBox}>
            <View style={styles.successIcon}>
              <Check size={28} color="#fff" strokeWidth={3} />
            </View>
            <Text style={styles.successTitle}>Montagem Registada!</Text>
            <Text style={styles.successSub}>
              A montagem da obra <Text style={{fontFamily: 'Exo2_700Bold'}}>{form.nObra}</Text> foi registada com sucesso.
            </Text>
            <TouchableOpacity style={styles.successBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.successBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},

  breadcrumb: {backgroundColor: ORANGE, paddingHorizontal: Spacing.base, paddingVertical: 7, flexDirection: 'row', alignItems: 'center'},
  breadcrumbLink: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 11, letterSpacing: 1, opacity: 0.85},
  breadcrumbSep:  {color: 'rgba(255,255,255,0.6)', fontSize: 11, marginHorizontal: 4},
  breadcrumbCurrent: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 11, letterSpacing: 1},

  scroll: {flex: 1},
  scrollContent: {padding: Spacing.base, paddingBottom: Spacing['3xl']},

  card: {backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2},
  cardHeader: {backgroundColor: NAVY, paddingHorizontal: Spacing.md, paddingVertical: 12},
  cardTitle: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 12, letterSpacing: 1.5},

  field: {paddingHorizontal: Spacing.md, paddingTop: Spacing.md},
  fieldLabel: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 1, marginBottom: 5},
  input: {borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, fontSize: FontSize.sm, color: Colors.gray900, fontFamily: 'Exo2_400Regular', backgroundColor: Colors.background},
  inputMulti: {height: 80, paddingTop: Spacing.sm},

  submitBtn: {backgroundColor: ORANGE, margin: Spacing.md, marginTop: Spacing.lg, borderRadius: BorderRadius.full, paddingVertical: 13, alignItems: 'center'},
  submitBtnDisabled: {opacity: 0.45},
  submitBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1},

  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl},
  successBox: {backgroundColor: '#fff', borderRadius: 20, padding: Spacing.xl, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 16}, shadowOpacity: 0.2, shadowRadius: 48, elevation: 20},
  successIcon: {width: 60, height: 60, borderRadius: 30, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md},
  successTitle: {fontFamily: 'Exo2_700Bold', fontSize: 16, color: Colors.gray900, marginBottom: Spacing.sm},
  successSub: {fontSize: FontSize.sm, color: Colors.gray600, fontFamily: 'Exo2_400Regular', textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg},
  successBtn: {backgroundColor: NAVY, borderRadius: BorderRadius.full, paddingVertical: 11, paddingHorizontal: Spacing.xl},
  successBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1},
});
