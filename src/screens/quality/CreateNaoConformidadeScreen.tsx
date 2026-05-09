import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Text, TouchableOpacity} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {Header, Card, Input, Button, LoadingOverlay} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {qualityApi} from '../../api/quality';

const GRAVIDADES: {value: string; label: string; color: string}[] = [
  {value: 'menor', label: '🟡 Menor', color: Colors.warning},
  {value: 'maior', label: '🟠 Maior', color: Colors.danger},
  {value: 'critica', label: '🔴 Crítica', color: '#7f1d1d'},
];

export const CreateNaoConformidadeScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const {inspeccaoId} = route.params;

  const [descricao, setDescricao] = useState('');
  const [gravidade, setGravidade] = useState('menor');
  const [acaoCorretiva, setAcaoCorretiva] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [prazo, setPrazo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleCreate = async () => {
    if (!descricao.trim()) { setErrors({descricao: 'A descrição é obrigatória'}); return; }
    setIsLoading(true);
    try {
      await qualityApi.createNaoConformidade({
        inspeccaoId,
        descricao,
        gravidade: gravidade as any,
        acaoCorretiva: acaoCorretiva || undefined,
        responsavel: responsavel || undefined,
        prazo: prazo || undefined,
        status: 'aberta',
      });
      navigation.goBack();
    } finally { setIsLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Header title="Nova Não Conformidade" showBack />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Card>
          <Input label="Descrição *" placeholder="Descreva a não conformidade..." value={descricao} onChangeText={setDescricao} error={errors.descricao} multiline numberOfLines={3} />
          <Text style={styles.label}>Gravidade</Text>
          <View style={styles.gravGrid}>
            {GRAVIDADES.map(g => (
              <TouchableOpacity
                key={g.value}
                style={[styles.gravBtn, gravidade === g.value && {backgroundColor: g.color, borderColor: g.color}]}
                onPress={() => setGravidade(g.value)}>
                <Text style={[styles.gravText, gravidade === g.value && styles.gravTextActive]}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
        <Card>
          <Input label="Ação Corretiva" placeholder="Descreva a ação corretiva proposta..." value={acaoCorretiva} onChangeText={setAcaoCorretiva} multiline numberOfLines={3} />
          <Input label="Responsável" placeholder="Nome do responsável" value={responsavel} onChangeText={setResponsavel} />
          <Input label="Prazo" placeholder="DD/MM/AAAA" value={prazo} onChangeText={setPrazo} />
        </Card>
        <Button label="Registar NC" onPress={handleCreate} loading={isLoading} fullWidth size="lg" />
      </ScrollView>
      {isLoading && <LoadingOverlay visible message="A registar..." />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  content: {padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl']},
  label: {fontSize: FontSize.sm, fontWeight: FontWeight.medium as any, color: Colors.gray700, marginBottom: Spacing.sm},
  gravGrid: {flexDirection: 'row', gap: Spacing.sm},
  gravBtn: {flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center'},
  gravText: {fontSize: FontSize.sm, fontWeight: FontWeight.medium as any, color: Colors.gray700},
  gravTextActive: {color: Colors.white},
});
