import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {useRouter} from 'expo-router';
import {useAppDispatch, useAppSelector} from '../../store';
import {createOrder} from '../../store/slices/ordersSlice';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {AppHeader, BottomNavBar} from '../../components/common';

const ORANGE = '#ff7700'; // --orange design system

const PRIORIDADES = [
  {label: 'Baixa', value: 'baixa'},
  {label: 'Normal', value: 'normal'},
  {label: 'Alta', value: 'alta'},
  {label: 'Urgente', value: 'urgente'},
];

const CLIENTES = [
  'ADRC Vasco da Gama',
  'Ascendi Operações, SA',
  'AEISCAC',
  'Universidade do Minho',
  'Grupo Sonae',
  'NOS Comunicações',
  'EDP Renováveis',
  'Câmara Municipal de Coimbra',
];

interface Material {
  nome: string;
  quantidade: string;
}

export const CreateOrderScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {orders, isLoading} = useAppSelector(s => s.orders);

  // Auto-generate reference
  const nextRef = `2026-${String(orders.length + 1).padStart(4, '0')}`;

  const [nome, setNome] = useState('');
  const [cliente, setCliente] = useState('');
  const [prioridade, setPrioridade] = useState('Normal');
  const [dataEntrega, setDataEntrega] = useState('');
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [showClientePicker, setShowClientePicker] = useState(false);
  const [showPrioridadePicker, setShowPrioridadePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const user = useAppSelector(s => s.auth.user);
  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const addMaterial = () => {
    setMateriais([...materiais, {nome: '', quantidade: ''}]);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Campo obrigatório';
    if (!cliente.trim()) e.cliente = 'Campo obrigatório';
    if (!dataEntrega.trim()) e.dataEntrega = 'Campo obrigatório';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    await dispatch(
      createOrder({
        referencia: nextRef,
        cliente,
        descricao: nome,
        quantidade: 1,
        dataFimPrevista: dataEntrega,
        prioridade: prioridade.toLowerCase() as any,
        status: 'planeamento',
        progresso: 0,
        dataInicio: new Date().toISOString(),
      }),
    );
    router.back();
  };

  return (
    <View style={styles.container}>
      <AppHeader
        section="PLANEAMENTO"
        subtitle="NOVA ORDEM DE PRODUÇÃO"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.breadcrumbText}>ORDENS DE PRODUÇÃO</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}> › </Text>
        <Text style={styles.breadcrumbCurrent}>NOVA OP</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Form card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🔧 NOVA ORDEM DE PRODUÇÃO</Text>
          </View>

          {/* Referência + Prioridade */}
          <View style={styles.row}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>REFERÊNCIA</Text>
              <View style={styles.inputReadonly}>
                <Text style={styles.inputReadonlyText}>{nextRef}</Text>
              </View>
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>PRIORIDADE</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setShowPrioridadePicker(!showPrioridadePicker)}>
                <Text style={styles.pickerBtnText}>{prioridade} ▾</Text>
              </TouchableOpacity>
              {showPrioridadePicker && (
                <View style={styles.pickerMenu}>
                  {PRIORIDADES.map(p => (
                    <TouchableOpacity
                      key={p.value}
                      style={styles.pickerMenuItem}
                      onPress={() => {setPrioridade(p.label); setShowPrioridadePicker(false);}}>
                      <Text style={styles.pickerMenuText}>{p.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Nome da OP */}
          <View style={styles.field}>
            <Text style={styles.label}>NOME DA OP</Text>
            <TextInput
              style={[styles.input, errors.nome && styles.inputError]}
              placeholder="Ex: Estrutura metálica Armazém"
              placeholderTextColor={Colors.gray400}
              value={nome}
              onChangeText={setNome}
            />
            {errors.nome && <Text style={styles.errorText}>{errors.nome}</Text>}
          </View>

          {/* Cliente */}
          <View style={styles.field}>
            <Text style={styles.label}>CLIENTE</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.pickerBtn, {flex: 1}, errors.cliente && styles.inputError]}
                onPress={() => setShowClientePicker(!showClientePicker)}>
                <Text style={[styles.pickerBtnText, !cliente && {color: Colors.gray400}]}>
                  {cliente || 'Selecionar cliente'} ▾
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.novoBtn}>
                <Text style={styles.novoBtnText}>+ Novo</Text>
              </TouchableOpacity>
            </View>
            {showClientePicker && (
              <View style={styles.pickerMenu}>
                {CLIENTES.map(c => (
                  <TouchableOpacity
                    key={c}
                    style={styles.pickerMenuItem}
                    onPress={() => {setCliente(c); setShowClientePicker(false);}}>
                    <Text style={styles.pickerMenuText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.cliente && <Text style={styles.errorText}>{errors.cliente}</Text>}
          </View>

          {/* Data Planeamento + Data Entrega */}
          <View style={styles.row}>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>DATA / HORA DE PLANEAMENTO</Text>
              <View style={styles.inputReadonly}>
                <Text style={styles.inputReadonlyText}>
                  {new Date().toLocaleDateString('pt-PT')} {new Date().toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'})}
                </Text>
              </View>
            </View>
            <View style={styles.fieldHalf}>
              <Text style={styles.label}>DATA ENTREGA PREVISTA</Text>
              <TextInput
                style={[styles.input, errors.dataEntrega && styles.inputError]}
                placeholder="dd/mm/aaaa"
                placeholderTextColor={Colors.gray400}
                value={dataEntrega}
                onChangeText={setDataEntrega}
              />
              {errors.dataEntrega && <Text style={styles.errorText}>{errors.dataEntrega}</Text>}
            </View>
          </View>

          {/* Materiais */}
          <TouchableOpacity style={styles.addMaterialBtn} onPress={addMaterial}>
            <Text style={styles.addMaterialText}>+  Inserir Material  +</Text>
          </TouchableOpacity>

          {materiais.length > 0 && (
            <View style={styles.materiaisSection}>
              <Text style={styles.label}>LISTA MATERIAL</Text>
              {materiais.map((m, i) => (
                <View key={i} style={styles.materialRow}>
                  <TextInput
                    style={[styles.input, {flex: 2}]}
                    placeholder="Nome do material"
                    placeholderTextColor={Colors.gray400}
                    value={m.nome}
                    onChangeText={v => {
                      const updated = [...materiais];
                      updated[i].nome = v;
                      setMateriais(updated);
                    }}
                  />
                  <TextInput
                    style={[styles.input, {flex: 1}]}
                    placeholder="Qtd."
                    placeholderTextColor={Colors.gray400}
                    keyboardType="numeric"
                    value={m.quantidade}
                    onChangeText={v => {
                      const updated = [...materiais];
                      updated[i].quantidade = v;
                      setMateriais(updated);
                    }}
                  />
                </View>
              ))}
            </View>
          )}

          {materiais.length === 0 && (
            <Text style={styles.emptyMateriais}>Nenhum material adicionado</Text>
          )}
        </View>

        {/* Create button */}
        <TouchableOpacity
          style={styles.createBtn}
          onPress={handleCreate}
          disabled={isLoading}
          activeOpacity={0.85}>
          <Text style={styles.createBtnText}>CRIAR ORDEM DE PRODUÇÃO</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},

  // Breadcrumb
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  breadcrumbText: {color: ORANGE, fontSize: FontSize.xs, fontWeight: FontWeight.semibold as any},
  breadcrumbSep: {color: Colors.white, fontSize: FontSize.xs},
  breadcrumbCurrent: {color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.semibold as any},

  // Scroll
  scroll: {flex: 1},
  scrollContent: {padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl']},

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  cardTitle: {
    color: Colors.white,
    fontWeight: FontWeight.bold as any,
    fontSize: FontSize.base,
  },

  // Fields
  row: {flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, paddingBottom: 0},
  field: {paddingHorizontal: Spacing.md, paddingTop: Spacing.md},
  fieldHalf: {flex: 1},
  label: {
    fontSize: 10,
    fontWeight: FontWeight.bold as any,
    color: Colors.gray500,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.gray900,
    backgroundColor: Colors.white,
  },
  inputError: {borderColor: Colors.danger},
  inputReadonly: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray50,
  },
  inputReadonlyText: {fontSize: FontSize.sm, color: Colors.gray600},
  errorText: {fontSize: FontSize.xs, color: Colors.danger, marginTop: 2},

  // Picker
  pickerBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
  },
  pickerBtnText: {fontSize: FontSize.sm, color: Colors.gray900},
  pickerMenu: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  pickerMenuItem: {paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm},
  pickerMenuText: {fontSize: FontSize.sm, color: Colors.gray700},

  // Novo cliente
  novoBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    justifyContent: 'center',
  },
  novoBtnText: {color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold as any},

  // Materiais
  addMaterialBtn: {
    margin: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
  },
  addMaterialText: {
    color: Colors.primaryLight,
    fontSize: FontSize.base,
    fontWeight: FontWeight.semibold as any,
  },
  materiaisSection: {paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm},
  materialRow: {flexDirection: 'row', gap: Spacing.sm},
  emptyMateriais: {
    color: Colors.gray400,
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingBottom: Spacing.md,
  },

  // Create button
  createBtn: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
  },
  createBtnText: {
    color: Colors.white,
    fontWeight: FontWeight.bold as any,
    fontSize: FontSize.base,
    letterSpacing: 1,
  },
});
