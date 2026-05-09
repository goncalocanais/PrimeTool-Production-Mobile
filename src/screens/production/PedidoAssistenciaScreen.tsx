import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, Text} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Header, Card, Input, Button, LoadingOverlay} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {ordersApi} from '../../api/orders';

const PRIORIDADES = ['baixa', 'media', 'alta', 'urgente'];
const PRIORIDADE_COLORS: Record<string, string> = {
  baixa: Colors.gray400,
  media: Colors.info,
  alta: Colors.warning,
  urgente: Colors.danger,
};

export const PedidoAssistenciaScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {ordemId} = route.params;

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState('media');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!titulo.trim()) e.titulo = 'O título é obrigatório';
    if (!descricao.trim()) e.descricao = 'A descrição é obrigatória';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await ordersApi.createPedidoAssistencia({
        ordemProducaoId: ordemId,
        titulo,
        descricao,
        prioridade: prioridade as any,
        status: 'pendente',
      });
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Pedido de Assistência" showBack />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <Card>
          <Input
            label="Título *"
            placeholder="Descreva brevemente o problema"
            value={titulo}
            onChangeText={setTitulo}
            error={errors.titulo}
          />
          <Input
            label="Descrição *"
            placeholder="Detalhe o problema e o que já foi tentado..."
            value={descricao}
            onChangeText={setDescricao}
            error={errors.descricao}
            multiline
            numberOfLines={5}
          />
        </Card>

        <Card>
          <Text style={styles.label}>Prioridade</Text>
          <View style={styles.prioGrid}>
            {PRIORIDADES.map(p => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.prioBtn,
                  prioridade === p && {
                    backgroundColor: PRIORIDADE_COLORS[p],
                    borderColor: PRIORIDADE_COLORS[p],
                  },
                ]}
                onPress={() => setPrioridade(p)}>
                <Text
                  style={[
                    styles.prioText,
                    {color: prioridade === p ? Colors.white : PRIORIDADE_COLORS[p]},
                  ]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Button label="Enviar Pedido" onPress={handleSubmit} loading={isLoading} fullWidth size="lg" />
      </ScrollView>
      {isLoading && <LoadingOverlay visible message="A enviar pedido..." />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  content: {padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl']},
  label: {fontSize: FontSize.sm, fontWeight: FontWeight.medium as any, color: Colors.gray700, marginBottom: Spacing.sm},
  prioGrid: {flexDirection: 'row', gap: Spacing.sm},
  prioBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  prioText: {fontSize: FontSize.sm, fontWeight: FontWeight.semibold as any},
});
