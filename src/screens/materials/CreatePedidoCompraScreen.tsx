import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, Text, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '../../store';
import {fetchMaterials} from '../../store/slices/materialsSlice';
import {Header, Card, Input, Button, LoadingOverlay} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {materialsApi} from '../../api/materials';

export const CreatePedidoCompraScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const {materials} = useAppSelector(s => s.materials);

  const [selectedMaterial, setSelectedMaterial] = useState<number | null>(null);
  const [fornecedor, setFornecedor] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [precoUnitario, setPrecoUnitario] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { dispatch(fetchMaterials()); }, [dispatch]);

  const filtered = materials.filter(
    m =>
      m.codigo.toLowerCase().includes(materialSearch.toLowerCase()) ||
      m.nome.toLowerCase().includes(materialSearch.toLowerCase()),
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedMaterial) e.material = 'Selecione um material';
    if (!fornecedor.trim()) e.fornecedor = 'O fornecedor é obrigatório';
    if (!quantidade || Number(quantidade) <= 0) e.quantidade = 'Quantidade inválida';
    if (!precoUnitario || Number(precoUnitario) <= 0) e.preco = 'Preço inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await materialsApi.createPedidoCompra({
        materialId: selectedMaterial!,
        fornecedor,
        quantidade: Number(quantidade),
        precoUnitario: Number(precoUnitario),
        dataEntregaPrevista: dataEntrega || undefined,
        status: 'pendente',
        quantidadeRecebida: 0,
        dataPedido: new Date().toISOString(),
        criadoPor: '',
      });
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Novo Pedido de Compra" showBack />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <Card>
          <Input label="Pesquisar Material" placeholder="Código ou nome..." value={materialSearch} onChangeText={setMaterialSearch} containerStyle={styles.noMargin} />
          {errors.material && <Text style={styles.errorText}>{errors.material}</Text>}
          <View style={styles.materialList}>
            {filtered.slice(0, 6).map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.item, selectedMaterial === m.id && styles.itemActive]}
                onPress={() => setSelectedMaterial(m.id)}>
                <Text style={[styles.itemCode, selectedMaterial === m.id && styles.itemTextActive]}>{m.codigo}</Text>
                <Text style={[styles.itemName, selectedMaterial === m.id && styles.itemTextActive]}>{m.nome}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card>
          <Input label="Fornecedor *" placeholder="Nome do fornecedor" value={fornecedor} onChangeText={setFornecedor} error={errors.fornecedor} />
          <Input label="Quantidade *" placeholder="Ex: 100" value={quantidade} onChangeText={setQuantidade} error={errors.quantidade} keyboardType="numeric" />
          <Input label="Preço Unitário (€) *" placeholder="Ex: 12.50" value={precoUnitario} onChangeText={setPrecoUnitario} error={errors.preco} keyboardType="decimal-pad" />
          <Input label="Data Entrega Prevista" placeholder="DD/MM/AAAA" value={dataEntrega} onChangeText={setDataEntrega} />
        </Card>

        <Button label="Criar Pedido de Compra" onPress={handleSubmit} loading={isLoading} fullWidth size="lg" />
      </ScrollView>
      {isLoading && <LoadingOverlay visible message="A criar pedido..." />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  content: {padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl']},
  noMargin: {marginBottom: Spacing.sm},
  errorText: {fontSize: FontSize.xs, color: Colors.danger, marginBottom: Spacing.sm},
  materialList: {gap: 4, marginTop: Spacing.sm},
  item: {padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border},
  itemActive: {backgroundColor: Colors.primary, borderColor: Colors.primary},
  itemCode: {fontSize: FontSize.xs, color: Colors.primaryLight, fontWeight: FontWeight.semibold as any},
  itemName: {fontSize: FontSize.sm, color: Colors.gray700},
  itemTextActive: {color: Colors.white},
});
