import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Text, TouchableOpacity} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useAppSelector} from '../../store';
import {Header, Card, Input, Button, LoadingOverlay} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {qualityApi} from '../../api/quality';

export const CreateInspeccaoScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {ordemId} = route.params;
  const user = useAppSelector(s => s.auth.user);

  const [tipo, setTipo] = useState<'intermedia' | 'final'>('intermedia');
  const [observacoes, setObservacoes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    setIsLoading(true);
    try {
      await qualityApi.create({
        ordemProducaoId: ordemId,
        tipo,
        inspector: user?.nome ?? '',
        dataInspeccao: new Date().toISOString(),
        observacoes: observacoes || undefined,
      });
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Nova Inspeção" showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.label}>Tipo de Inspeção</Text>
          <View style={styles.tipoRow}>
            {(['intermedia', 'final'] as const).map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.tipoBtn, tipo === t && styles.tipoBtnActive]}
                onPress={() => setTipo(t)}>
                <Text style={[styles.tipoText, tipo === t && styles.tipoTextActive]}>
                  {t === 'intermedia' ? '🔍 Intermédia' : '✅ Final'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
        <Card>
          <Input label="Observações" placeholder="Notas iniciais sobre a inspeção..." value={observacoes} onChangeText={setObservacoes} multiline numberOfLines={4} />
        </Card>
        <Button label="Criar Inspeção" onPress={handleCreate} loading={isLoading} fullWidth size="lg" />
      </ScrollView>
      {isLoading && <LoadingOverlay visible message="A criar inspeção..." />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  content: {padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl']},
  label: {fontSize: FontSize.sm, fontWeight: FontWeight.medium as any, color: Colors.gray700, marginBottom: Spacing.md},
  tipoRow: {flexDirection: 'row', gap: Spacing.sm},
  tipoBtn: {flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center'},
  tipoBtnActive: {backgroundColor: Colors.primary, borderColor: Colors.primary},
  tipoText: {fontSize: FontSize.base, fontWeight: FontWeight.medium as any, color: Colors.gray700},
  tipoTextActive: {color: Colors.white},
});
