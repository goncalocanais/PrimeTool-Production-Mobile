import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, FlatList, Alert, Keyboard, KeyboardAvoidingView, Platform} from 'react-native';
import {useRouter} from 'expo-router';
import {Check, X} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar, DateInput} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';
import {montagensApi} from '../../api/montagens';
import {ordersApi} from '../../api/orders';

const NAVY  = Colors.primary;
const ORANGE = Colors.warning;
const GREEN  = Colors.success;

export const RegistarMontagemScreen: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);

  const [opsMontagem, setOpsMontagem] = useState<{id: number; referencia: string; descricao: string; nome: string; cliente: string}[]>([]);
  const [selectedOpId, setSelectedOpId] = useState<number | null>(null);
  const [showOpPicker, setShowOpPicker] = useState(false);
  const [form, setForm] = useState({titulo: '', descricao: '', dataPrevista: '', observacoes: ''});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  useEffect(() => {
    ordersApi.getAll({status: 'montagem'}).then(ops => {
      const mapped = ops.map(o => ({id: o.id, referencia: o.referencia, descricao: o.descricao, nome: o.descricao, cliente: o.cliente}));
      setOpsMontagem(mapped);
      if (mapped.length > 0) {
        setSelectedOpId(mapped[0].id);
        setForm(p => ({...p, titulo: `Montagem - ${mapped[0].nome}`}));
      }
    }).catch(console.error);
  }, []);

  const selectedOp = opsMontagem.find(o => o.id === selectedOpId);
  const isValid = selectedOpId && form.titulo.trim();

  const handleSubmit = async () => {
    if (!isValid || isSubmitting || !selectedOpId) return;
    Keyboard.dismiss();
    setIsSubmitting(true);
    try {
      await montagensApi.create({
        ordemId:      selectedOpId,
        titulo:       form.titulo.trim(),
        descricao:    form.descricao.trim(),
        dataPrevista: form.dataPrevista.trim() || undefined,
        observacoes:  form.observacoes.trim() || undefined,
      });
      setShowSuccess(true);
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível registar a tarefa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = () => {
    setShowSuccess(false);
    setForm({titulo: '', descricao: '', dataPrevista: '', observacoes: ''});
    router.push('/assembly/montagens');
  };

  return (
    <View style={styles.container}>
      <AppHeader
        section="MONTAGEM"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/assembly/montagens')}>
          <Text style={styles.breadcrumbLink}>MONTAGEM</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}> › </Text>
        <Text style={styles.breadcrumbCurrent}>REGISTAR TAREFA</Text>
      </View>

      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>DADOS DA TAREFA DE MONTAGEM</Text>
          </View>

          {/* OP Picker */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>ORDEM DE PRODUÇÃO *</Text>
            {opsMontagem.length === 0 ? (
              <View style={styles.emptyOps}>
                <Text style={styles.emptyOpsText}>Nenhuma OP em montagem.</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.input} onPress={() => setShowOpPicker(true)} activeOpacity={0.85}>
                  <Text style={{fontSize: FontSize.sm, color: selectedOpId ? Colors.gray900 : Colors.gray400, fontFamily: 'Exo2_400Regular'}}>
                    {selectedOp?.referencia || 'Selecionar OP'} ▾
                  </Text>
                </TouchableOpacity>
                {selectedOp && <Text style={styles.opDescricao}>{selectedOp.descricao}</Text>}
                {selectedOp && !!selectedOp.cliente && <Text style={[styles.opDescricao, {color: NAVY, opacity: 0.8}]}>{selectedOp.cliente}</Text>}
              </>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>TÍTULO DA TAREFA *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Montagem estrutura principal"
              placeholderTextColor={Colors.gray400}
              value={form.titulo}
              onChangeText={v => setForm(p => ({...p, titulo: v}))}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>DESCRIÇÃO</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Descrição da tarefa..."
              placeholderTextColor={Colors.gray400}
              value={form.descricao}
              onChangeText={v => setForm(p => ({...p, descricao: v}))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>DATA PREVISTA</Text>
            <DateInput
              style={styles.input}
              value={form.dataPrevista}
              onChangeText={v => setForm(p => ({...p, dataPrevista: v}))}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>OBSERVAÇÕES</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Notas adicionais..."
              placeholderTextColor={Colors.gray400}
              value={form.observacoes}
              onChangeText={v => setForm(p => ({...p, observacoes: v}))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (!isValid || isSubmitting) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || isSubmitting}
            activeOpacity={0.85}>
            <Text style={styles.submitBtnText}>{isSubmitting ? 'A REGISTAR...' : 'REGISTAR TAREFA'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <BottomNavBar />

      {/* OP picker modal */}
      <Modal visible={showOpPicker} transparent animationType="fade" onRequestClose={() => setShowOpPicker(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowOpPicker(false)}>
          <View style={styles.pickerBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.pickerTitle}>OPs em Montagem</Text>
            <FlatList
              data={opsMontagem}
              keyExtractor={o => String(o.id)}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[styles.pickerItem, item.id === selectedOpId && styles.pickerItemActive]}
                  onPress={() => { setSelectedOpId(item.id); setForm(p => ({...p, titulo: `Montagem - ${item.nome}`})); setShowOpPicker(false); }}>
                  <Text style={[styles.pickerItemRef, item.id === selectedOpId && {color: NAVY, fontFamily: 'Exo2_700Bold'}]}>{item.referencia}</Text>
                  <Text style={styles.pickerItemDesc}>{item.descricao}</Text>
                  {!!item.cliente && <Text style={[styles.pickerItemDesc, {color: Colors.primary, opacity: 0.8}]}>{item.cliente}</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Success modal */}
      <Modal visible={showSuccess} transparent animationType="fade" onRequestClose={() => setShowSuccess(false)}>
        <View style={styles.overlay}>
          <View style={styles.successBox}>
            <View style={styles.successIcon}>
              <Check size={28} color="#fff" strokeWidth={3} />
            </View>
            <Text style={styles.successTitle}>Tarefa Registada!</Text>
            <Text style={styles.successSub}>
              A tarefa <Text style={{fontFamily: 'Exo2_700Bold'}}>{form.titulo}</Text> foi registada com sucesso.
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
  emptyOps: {padding: Spacing.md, backgroundColor: Colors.gray50, borderRadius: 8, borderWidth: 1, borderColor: Colors.border},
  emptyOpsText: {fontSize: FontSize.sm, color: Colors.gray500, fontFamily: 'Exo2_400Regular', textAlign: 'center'},
  opDescricao: {fontSize: 11, color: Colors.gray500, fontFamily: 'Exo2_400Regular', marginTop: 4, paddingLeft: 2},

  submitBtn: {backgroundColor: ORANGE, margin: Spacing.md, marginTop: Spacing.lg, borderRadius: BorderRadius.full, paddingVertical: 13, alignItems: 'center'},
  submitBtnDisabled: {opacity: 0.45},
  submitBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1},

  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl},
  pickerBox: {backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', width: '100%', maxHeight: 350, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8},
  pickerTitle: {fontSize: 11, fontFamily: 'Exo2_700Bold', color: NAVY, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border},
  pickerItem: {padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.gray50},
  pickerItemActive: {backgroundColor: '#f0f4ff'},
  pickerItemRef: {fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular', color: Colors.gray700},
  pickerItemDesc: {fontSize: 10, color: Colors.gray400, fontFamily: 'Exo2_400Regular', marginTop: 1},

  successBox: {backgroundColor: '#fff', borderRadius: 20, padding: Spacing.xl, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 16}, shadowOpacity: 0.2, shadowRadius: 48, elevation: 20},
  successIcon: {width: 60, height: 60, borderRadius: 30, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md},
  successTitle: {fontFamily: 'Exo2_700Bold', fontSize: 16, color: Colors.gray900, marginBottom: Spacing.sm},
  successSub: {fontSize: FontSize.sm, color: Colors.gray600, fontFamily: 'Exo2_400Regular', textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg},
  successBtn: {backgroundColor: NAVY, borderRadius: BorderRadius.full, paddingVertical: 11, paddingHorizontal: Spacing.xl},
  successBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1},
});
