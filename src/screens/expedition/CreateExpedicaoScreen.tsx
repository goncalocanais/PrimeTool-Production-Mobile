import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, Text, TouchableOpacity} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '../../store';
import {fetchOrders} from '../../store/slices/ordersSlice';
import {Header, Card, Input, Button, LoadingOverlay} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {expeditionApi} from '../../api/expedition';

export const CreateExpedicaoScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {ordemId} = route.params ?? {};
  const {orders} = useAppSelector(s => s.orders);

  const [selectedOrdem, setSelectedOrdem] = useState<number | null>(ordemId ?? null);
  const [destinatario, setDestinatario] = useState('');
  const [morada, setMorada] = useState('');
  const [dataPrevisao, setDataPrevisao] = useState('');
  const [peso, setPeso] = useState('');
  const [volumes, setVolumes] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { if (!ordemId) dispatch(fetchOrders()); }, [dispatch, ordemId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!selectedOrdem) e.ordem = 'Selecione uma ordem de produção';
    if (!destinatario.trim()) e.destinatario = 'O destinatário é obrigatório';
    if (!morada.trim()) e.morada = 'A morada é obrigatória';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await expeditionApi.create({
        ordemProducaoId: selectedOrdem!,
        destinatario,
        moradaEntrega: morada,
        dataPrevisaoEntrega: dataPrevisao || undefined,
        peso: peso ? Number(peso) : undefined,
        volumes: volumes ? Number(volumes) : undefined,
        observacoes: observacoes || undefined,
        status: 'pendente',
        criadoPor: '',
      });
      navigation.goBack();
    } finally { setIsLoading(false); }
  };

  const opsExpedicao = orders.filter(o => o.status === 'expedicao');

  return (
    <View style={styles.container}>
      <Header title="Nova Expedição" showBack />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {!ordemId && (
          <Card>
            <Text style={styles.sectionTitle}>Ordem de Produção *</Text>
            {errors.ordem && <Text style={styles.errorText}>{errors.ordem}</Text>}
            {opsExpedicao.map(o => (
              <TouchableOpacity
                key={o.id}
                style={[styles.item, selectedOrdem === o.id && styles.itemActive]}
                onPress={() => setSelectedOrdem(o.id)}>
                <Text style={[styles.itemText, selectedOrdem === o.id && styles.itemTextActive]}>
                  {o.referencia} — {o.cliente}
                </Text>
              </TouchableOpacity>
            ))}
            {opsExpedicao.length === 0 && <Text style={styles.empty}>Não há OPs prontas para expedição</Text>}
          </Card>
        )}

        <Card>
          <Input label="Destinatário *" placeholder="Nome do destinatário" value={destinatario} onChangeText={setDestinatario} error={errors.destinatario} />
          <Input label="Morada de Entrega *" placeholder="Rua, cidade, código postal..." value={morada} onChangeText={setMorada} error={errors.morada} multiline />
          <Input label="Data Previsão Entrega" placeholder="DD/MM/AAAA" value={dataPrevisao} onChangeText={setDataPrevisao} />
          <Input label="Peso (kg)" placeholder="Ex: 25.5" value={peso} onChangeText={setPeso} keyboardType="decimal-pad" />
          <Input label="Nº de Volumes" placeholder="Ex: 3" value={volumes} onChangeText={setVolumes} keyboardType="numeric" />
          <Input label="Observações" placeholder="Notas adicionais..." value={observacoes} onChangeText={setObservacoes} multiline numberOfLines={3} />
        </Card>

        <Button label="Criar Expedição" onPress={handleCreate} loading={isLoading} fullWidth size="lg" />
      </ScrollView>
      {isLoading && <LoadingOverlay visible message="A criar expedição..." />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  content: {padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl']},
  sectionTitle: {fontSize: FontSize.base, fontWeight: FontWeight.semibold as any, color: Colors.gray800, marginBottom: Spacing.sm},
  errorText: {fontSize: FontSize.xs, color: Colors.danger, marginBottom: Spacing.sm},
  item: {padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 4},
  itemActive: {backgroundColor: Colors.primary, borderColor: Colors.primary},
  itemText: {fontSize: FontSize.sm, color: Colors.gray700},
  itemTextActive: {color: Colors.white},
  empty: {fontSize: FontSize.sm, color: Colors.gray400, textAlign: 'center', padding: Spacing.base},
});
