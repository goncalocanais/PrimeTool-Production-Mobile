import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {useRouter} from 'expo-router';
import {X} from 'lucide-react-native';
import {useAppDispatch, useAppSelector} from '../../store';
import {createOrder} from '../../store/slices/ordersSlice';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {AppHeader, BottomNavBar, DateInput} from '../../components/common';
import {ordersApi} from '../../api/orders';
import {materialsApi} from '../../api/materials';
import {notificacoesApi} from '../../api/notificacoes';
import {supabase} from '../../lib/supabase';

const ORANGE = '#ff7700'; // --orange design system

const PRIORIDADES = [
  {label: 'Baixa', value: 'baixa'},
  {label: 'Normal', value: 'normal'},
  {label: 'Alta', value: 'alta'},
  {label: 'Urgente', value: 'urgente'},
];


interface Material {
  nome: string;
  quantidade: string;
  valid: boolean;
}

export const CreateOrderScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {isLoading} = useAppSelector(s => s.orders);

  const [nome, setNome] = useState('');
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [clienteNome, setClienteNome] = useState('');
  const [clientes, setClientes] = useState<{id: number; nome: string}[]>([]);
  const [prioridade, setPrioridade] = useState('Normal');
  const [dataEntrega, setDataEntrega] = useState('');
  const [nextRef, setNextRef] = useState('A gerar...');
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggRow, setActiveSuggRow] = useState<number | null>(null);
  const suggTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showClientePicker, setShowClientePicker] = useState(false);
  const [showPrioridadePicker, setShowPrioridadePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const user = useAppSelector(s => s.auth.user);

  useEffect(() => {
    ordersApi.getNextReferencia().then(setNextRef).catch(() => setNextRef('2026-0001'));
    ordersApi.getClientes().then(cls => {
      setClientes(cls);
      if (cls.length > 0) { setClienteId(cls[0].id); setClienteNome(cls[0].nome); }
    }).catch(() => {});
  }, []);

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const addMaterial = () => {
    setMateriais([...materiais, {nome: '', quantidade: '', valid: false}]);
  };

  const removeMaterial = (i: number) => {
    setMateriais(prev => prev.filter((_, idx) => idx !== i));
    if (activeSuggRow === i) { setSuggestions([]); setActiveSuggRow(null); }
  };

  const handleNomeChange = (text: string, i: number) => {
    const updated = [...materiais];
    updated[i] = {...updated[i], nome: text, valid: false};
    setMateriais(updated);
    setActiveSuggRow(i);
    if (suggTimeout.current) clearTimeout(suggTimeout.current);
    if (text.length >= 2) {
      suggTimeout.current = setTimeout(async () => {
        try {
          const results = await materialsApi.getAll(text);
          setSuggestions(results.map(r => r.nome));
        } catch { setSuggestions([]); }
      }, 250);
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (nome: string, i: number) => {
    const updated = [...materiais];
    updated[i] = {...updated[i], nome, valid: true};
    setMateriais(updated);
    setSuggestions([]);
    setActiveSuggRow(null);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Campo obrigatório';
    if (!clienteId) e.cliente = 'Campo obrigatório';
    if (!dataEntrega.trim()) e.dataEntrega = 'Campo obrigatório';
    const invalidMat = materiais.some(m => m.nome.trim() && !m.valid);
    if (invalidMat) e.materiais = 'Seleciona os materiais da lista do inventário';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    try {
      const validMateriais = materiais.filter(m => m.nome.trim() && m.valid);

      // Verificar stock ANTES de criar qualquer coisa
      if (validMateriais.length > 0) {
        const insufficient: {nome: string; pedido: number; disponivel: number}[] = [];
        for (const m of validMateriais) {
          const qty = parseFloat(m.quantidade) || 1;
          const stock = await materialsApi.getStockByName(m.nome);
          if (stock.materialId !== null && stock.available < qty) {
            insufficient.push({nome: m.nome, pedido: qty, disponivel: stock.available});
          }
        }
        if (insufficient.length > 0) {
          const linhas = insufficient.map(i => `• ${i.nome}: pedido ${i.pedido}, disponível ${i.disponivel}`).join('\n');
          for (const i of insufficient) {
            const stock = await materialsApi.getStockByName(i.nome);
            notificacoesApi.create(
              'armazem',
              'Reposição de stock necessária',
              `Tentativa de criar OP: ${i.nome} — pedido ${i.pedido}, disponível ${i.disponivel}. Repor stock para desbloquear a OP.`,
            ).catch(() => {});
          }
          Alert.alert(
            'Stock insuficiente — OP não criada',
            `Não é possível criar a OP.\n\n${linhas}\n\nO armazém foi notificado. Aguarda a reposição de stock.`,
          );
          return;
        }
      }

      // Stock suficiente — criar OP
      const newOp = await ordersApi.create({
        referencia: nextRef,
        descricao: nome,
        dataFimPrevista: dataEntrega,
        prioridade: prioridade.toLowerCase() as any,
        status: 'planeamento',
        dataInicio: new Date().toISOString(),
        clienteId: clienteId ?? undefined,
        criadoPorId: user?.id,
      } as any);

      const rows = validMateriais.map(m => ({
        descricao_material: m.nome,
        quantidade: parseFloat(m.quantidade) || 1,
        unidade: 'un',
        justificacao: '',
        observacoes: 'planeamento',
        estado: 'pendente',
        ordem_id: newOp.id,
        pedido_em: new Date().toISOString(),
      }));

      if (rows.length > 0) {
        await supabase.from('producao_pedidomaterialadicional').insert(rows);
        // Deduzir stock agora que sabemos que é suficiente
        for (const r of rows) {
          const stock = await materialsApi.getStockByName(r.descricao_material);
          if (stock.materialId) {
            await materialsApi.deductByName(stock.materialId, r.quantidade, newOp.referencia);
          }
        }
      }

      router.back();
    } catch (e) { console.error(e); }
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

      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Form card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>NOVA ORDEM DE PRODUÇÃO</Text>
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
            <TouchableOpacity
              style={[styles.pickerBtn, errors.cliente && styles.inputError]}
              onPress={() => setShowClientePicker(true)}>
              <Text style={[styles.pickerBtnText, !clienteNome && {color: Colors.gray400}]}>
                {clienteNome || 'Selecionar cliente'} ▾
              </Text>
            </TouchableOpacity>
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
              <DateInput
                style={[styles.input, errors.dataEntrega && styles.inputError]}
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

          {errors.materiais && (
            <View style={styles.matErrorBox}>
              <Text style={styles.matErrorText}>{errors.materiais}</Text>
            </View>
          )}

          {materiais.length > 0 && (
            <View style={styles.materiaisSection}>
              <Text style={styles.label}>LISTA MATERIAL</Text>
              {materiais.map((m, i) => (
                <View key={i} style={styles.materialRowWrap}>
                  <View style={styles.materialRow}>
                    <TextInput
                      style={[styles.input, {flex: 2},
                        m.nome.trim() && !m.valid && styles.inputError,
                        m.valid && styles.inputValid,
                      ]}
                      placeholder="Escreve para pesquisar..."
                      placeholderTextColor={Colors.gray400}
                      value={m.nome}
                      onChangeText={v => handleNomeChange(v, i)}
                      onFocus={() => { setActiveSuggRow(i); if (m.nome.length >= 2) handleNomeChange(m.nome, i); }}
                      onBlur={() => setTimeout(() => { setSuggestions([]); setActiveSuggRow(null); }, 180)}
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
                    <TouchableOpacity onPress={() => removeMaterial(i)} style={styles.removeBtn} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                      <X size={16} color={Colors.danger} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                  {activeSuggRow === i && suggestions.length > 0 && (
                    <View style={styles.suggBox}>
                      {suggestions.map((s, si) => (
                        <TouchableOpacity key={si} style={styles.suggItem} onPress={() => selectSuggestion(s, i)}>
                          <Text style={styles.suggText}>{s}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
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
      </KeyboardAvoidingView>
      <BottomNavBar />

      <Modal visible={showClientePicker} transparent animationType="fade" onRequestClose={() => setShowClientePicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowClientePicker(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>SELECIONAR CLIENTE</Text>
            <FlatList
              data={clientes}
              keyExtractor={c => String(c.id)}
              style={styles.modalList}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[styles.modalItem, item.id === clienteId && styles.modalItemActive]}
                  onPress={() => {setClienteId(item.id); setClienteNome(item.nome); setShowClientePicker(false);}}>
                  <Text style={[styles.modalItemText, item.id === clienteId && styles.modalItemTextActive]}>
                    {item.nome}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},

  // Breadcrumb
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ORANGE,
    paddingHorizontal: Spacing.base,
    paddingVertical: 7,
  },
  breadcrumbText: {color: '#fff', fontSize: FontSize.xs, fontFamily: 'Exo2_700Bold', letterSpacing: 1, opacity: 0.85},
  breadcrumbSep: {color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs, marginHorizontal: 4},
  breadcrumbCurrent: {color: '#fff', fontSize: FontSize.xs, fontFamily: 'Exo2_700Bold', letterSpacing: 1},

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
  inputValid: {borderColor: Colors.success, backgroundColor: '#f0fdf4'},
  matErrorBox: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    backgroundColor: '#fef2f2',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  matErrorText: {
    color: Colors.danger,
    fontSize: FontSize.xs,
    fontFamily: 'Exo2_400Regular',
  },
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
  materialRowWrap: {zIndex: 10},
  materialRow: {flexDirection: 'row', gap: Spacing.sm, alignItems: 'center'},
  removeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  suggBox: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginTop: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray50,
  },
  suggText: {
    fontSize: FontSize.sm,
    color: Colors.gray800,
    fontFamily: 'Exo2_400Regular',
  },
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

  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl},
  modalBox: {backgroundColor: Colors.white, borderRadius: BorderRadius.lg, width: '100%', maxHeight: 400, overflow: 'hidden', shadowColor: '#000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12},
  modalTitle: {fontSize: FontSize.xs, fontFamily: 'Exo2_700Bold', color: Colors.gray500, letterSpacing: 1.5, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border},
  modalList: {maxHeight: 340},
  modalItem: {paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderBottomWidth: 1, borderBottomColor: Colors.gray50},
  modalItemActive: {backgroundColor: Colors.gray50},
  modalItemText: {fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular', color: Colors.gray700},
  modalItemTextActive: {fontFamily: 'Exo2_700Bold', color: Colors.primary},
});
