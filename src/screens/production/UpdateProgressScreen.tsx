import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '../../store';
import {updateOrderProgress} from '../../store/slices/ordersSlice';
import {Header, Card, Button, Input, LoadingOverlay} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';

const QUICK_VALUES = [10, 25, 50, 75, 90, 100];

export const UpdateProgressScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {id} = route.params;

  const {selectedOrder: order, isLoading} = useAppSelector(s => s.orders);

  const [progresso, setProgresso] = useState(order?.progresso ?? 0);
  const [descricao, setDescricao] = useState('');
  const [descricaoError, setDescricaoError] = useState('');

  const handleSave = async () => {
    if (!descricao.trim()) {
      setDescricaoError('A descrição é obrigatória');
      return;
    }
    const result = await dispatch(updateOrderProgress({id, progresso, descricao}));
    if (updateOrderProgress.fulfilled.match(result)) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Registar Progresso" subtitle={order?.referencia} showBack />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <Card>
          <Text style={styles.label}>Percentagem de Conclusão</Text>
          <Text style={styles.progressValue}>{progresso}%</Text>

          {/* Slider manual */}
          <View style={styles.sliderWrap}>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, {width: `${progresso}%`}]} />
            </View>
          </View>

          {/* Quick values */}
          <View style={styles.quickValues}>
            {QUICK_VALUES.map(v => (
              <TouchableOpacity
                key={v}
                style={[styles.quickBtn, progresso === v && styles.quickBtnActive]}
                onPress={() => setProgresso(v)}>
                <Text style={[styles.quickText, progresso === v && styles.quickTextActive]}>
                  {v}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Manual input */}
          <View style={styles.manualRow}>
            <TouchableOpacity
              style={styles.stepper}
              onPress={() => setProgresso(Math.max(0, progresso - 5))}>
              <Text style={styles.stepperText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{progresso}%</Text>
            <TouchableOpacity
              style={styles.stepper}
              onPress={() => setProgresso(Math.min(100, progresso + 5))}>
              <Text style={styles.stepperText}>+</Text>
            </TouchableOpacity>
          </View>
        </Card>

        <Card>
          <Input
            label="Descrição da atualização *"
            placeholder="Descreva o que foi feito neste registo..."
            value={descricao}
            onChangeText={text => {
              setDescricao(text);
              if (descricaoError) setDescricaoError('');
            }}
            error={descricaoError}
            multiline
            numberOfLines={4}
          />
        </Card>

        <Button label="Guardar Progresso" onPress={handleSave} loading={isLoading} fullWidth size="lg" />
      </ScrollView>
      {isLoading && <LoadingOverlay visible message="A guardar..." />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  content: {padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl']},
  label: {fontSize: FontSize.sm, color: Colors.gray600, fontWeight: FontWeight.medium as any, marginBottom: Spacing.sm},
  progressValue: {
    fontSize: 48,
    fontWeight: FontWeight.bold as any,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.base,
  },
  sliderWrap: {marginBottom: Spacing.base},
  sliderTrack: {
    height: 8,
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  sliderFill: {height: '100%', backgroundColor: Colors.primaryLight, borderRadius: BorderRadius.full},
  quickValues: {flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base},
  quickBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  quickBtnActive: {backgroundColor: Colors.primary, borderColor: Colors.primary},
  quickText: {fontSize: FontSize.sm, color: Colors.gray600, fontWeight: FontWeight.medium as any},
  quickTextActive: {color: Colors.white},
  manualRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl},
  stepper: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperText: {fontSize: 22, color: Colors.primary, fontWeight: FontWeight.bold as any},
  stepperValue: {fontSize: FontSize.xl, fontWeight: FontWeight.bold as any, color: Colors.gray800, minWidth: 60, textAlign: 'center'},
});
