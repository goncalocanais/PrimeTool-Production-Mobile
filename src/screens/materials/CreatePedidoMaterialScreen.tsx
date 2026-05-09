import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '../../store';
import {createPedidoMaterial, fetchMaterials} from '../../store/slices/materialsSlice';
import {fetchOrders} from '../../store/slices/ordersSlice';
import {Header, Card, Input, Button, LoadingOverlay} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';

export const CreatePedidoMaterialScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {ordemId} = route.params ?? {};

  const {materials, isLoading} = useAppSelector(s => s.materials);
  const {orders} = useAppSelector(s => s.orders);

  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [selectedOrdem, setSelectedOrdem] = useState<number | null>(ordemId ?? null);
  const [quantidade, setQuantidade] = useState('');
  const [justificacao, setJustificacao] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    dispatch(fetchMaterials());
    dispatch(fetchOrders());
  }, [dispatch]);

  const filteredMaterials = materials.filter(
    m =>
      m.codigo.toLowerCase().includes(materialSearch.toLowerCase()) ||
      m.nome.toLowerCase().includes(materialSearch.toLowerCase()),
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedMaterial) e.material = 'Selecione um material';
    if (!selectedOrdem) e.ordem = 'Selecione uma ordem de produção';
    if (!quantidade || isNaN(Number(quantidade)) || Number(quantidade) <= 0)
      e.quantidade = 'Quantidade inválida';
    if (!justificacao.trim()) e.justificacao = 'A justificação é obrigatória';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const result = await dispatch(
      createPedidoMaterial({
        materialId: selectedMaterial!,
        ordemProducaoId: selectedOrdem!,
        quantidade: Number(quantidade),
        justificacao,
        status: 'pendente',
      }),
    );
    if (createPedidoMaterial.fulfilled.match(result)) {
      navigation.goBack();
    }
  };

  const selectedMaterialObj = materials.find(m => m.id === selectedMaterial);
  const selectedOrdemObj = orders.find(o => o.id === selectedOrdem);

  return (
    <View style={styles.container}>
      <Header title="Pedido de Material" showBack />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* Ordem de produção */}
        {!ordemId && (
          <Card>
            <Text style={styles.sectionTitle}>Ordem de Produção *</Text>
            {errors.ordem && <Text style={styles.errorText}>{errors.ordem}</Text>}
            {orders
              .filter(o => o.status === 'em_producao')
              .map(o => (
                <TouchableOpacity
                  key={o.id}
                  style={[styles.selectItem, selectedOrdem === o.id && styles.selectItemActive]}
                  onPress={() => setSelectedOrdem(o.id)}>
                  <Text style={[styles.selectItemText, selectedOrdem === o.id && styles.selectItemTextActive]}>
                    {o.referencia} — {o.cliente}
                  </Text>
                </TouchableOpacity>
              ))}
          </Card>
        )}

        {ordemId && selectedOrdemObj && (
          <Card>
            <Text style={styles.sectionTitle}>Ordem de Produção</Text>
            <Text style={styles.selectedText}>
              {selectedOrdemObj.referencia} — {selectedOrdemObj.cliente}
            </Text>
          </Card>
        )}

        {/* Material */}
        <Card>
          <Text style={styles.sectionTitle}>Material *</Text>
          {errors.material && <Text style={styles.errorText}>{errors.material}</Text>}
          <Input
            placeholder="Pesquisar material..."
            value={materialSearch}
            onChangeText={setMaterialSearch}
            containerStyle={styles.searchContainer}
          />
          {selectedMaterialObj && (
            <View style={styles.selectedMat}>
              <Text style={styles.selectedMatCode}>{selectedMaterialObj.codigo}</Text>
              <Text style={styles.selectedMatName}>{selectedMaterialObj.nome}</Text>
              <Text style={styles.selectedMatStock}>
                Stock atual: {selectedMaterialObj.stockAtual} {selectedMaterialObj.unidade}
              </Text>
            </View>
          )}
          <View style={styles.materialList}>
            {filteredMaterials.slice(0, 8).map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.selectItem, selectedMaterial === m.id && styles.selectItemActive]}
                onPress={() => setSelectedMaterial(m.id)}>
                <Text style={[styles.selectItemCode, selectedMaterial === m.id && styles.selectItemTextActive]}>
                  {m.codigo}
                </Text>
                <Text style={[styles.selectItemText, selectedMaterial === m.id && styles.selectItemTextActive]}>
                  {m.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Quantidade e justificação */}
        <Card>
          <Input
            label="Quantidade *"
            placeholder="Ex: 50"
            value={quantidade}
            onChangeText={setQuantidade}
            error={errors.quantidade}
            keyboardType="numeric"
          />
          <Input
            label="Justificação *"
            placeholder="Motivo do pedido de material adicional..."
            value={justificacao}
            onChangeText={setJustificacao}
            error={errors.justificacao}
            multiline
            numberOfLines={4}
          />
        </Card>

        <Button label="Submeter Pedido" onPress={handleSubmit} loading={isLoading} fullWidth size="lg" />
      </ScrollView>
      {isLoading && <LoadingOverlay visible message="A enviar pedido..." />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  content: {padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl']},
  sectionTitle: {fontSize: FontSize.base, fontWeight: FontWeight.semibold as any, color: Colors.gray800, marginBottom: Spacing.sm},
  errorText: {fontSize: FontSize.xs, color: Colors.danger, marginBottom: Spacing.sm},
  searchContainer: {marginBottom: Spacing.sm},
  selectedText: {fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.medium as any},
  selectedMat: {
    backgroundColor: Colors.primaryUltraLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  selectedMatCode: {fontSize: FontSize.xs, color: Colors.primaryLight, fontWeight: FontWeight.semibold as any},
  selectedMatName: {fontSize: FontSize.base, color: Colors.gray900, fontWeight: FontWeight.medium as any},
  selectedMatStock: {fontSize: FontSize.sm, color: Colors.gray600, marginTop: 2},
  materialList: {gap: 4},
  selectItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  selectItemActive: {backgroundColor: Colors.primary, borderColor: Colors.primary},
  selectItemCode: {fontSize: FontSize.xs, color: Colors.primaryLight, fontWeight: FontWeight.semibold as any},
  selectItemText: {fontSize: FontSize.sm, color: Colors.gray700},
  selectItemTextActive: {color: Colors.white},
});
