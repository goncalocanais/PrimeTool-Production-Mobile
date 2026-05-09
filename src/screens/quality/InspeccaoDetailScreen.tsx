import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useAppSelector} from '../../store';
import {Header, Card, Badge, Button, LoadingOverlay} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {InspeccaoQualidade, InspeccaoResultado} from '../../types';
import {qualityApi} from '../../api/quality';

const RESULTADOS: {value: InspeccaoResultado; label: string; color: string}[] = [
  {value: 'aprovado', label: 'Aprovado', color: Colors.success},
  {value: 'aprovado_com_ressalvas', label: 'Aprovado c/ ressalvas', color: Colors.warning},
  {value: 'reprovado', label: 'Reprovado', color: Colors.danger},
];

export const InspeccaoDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const {id} = route.params;
  const user = useAppSelector(s => s.auth.user);
  const isQualidade = ['qualidade', 'direcao'].includes(user?.perfil ?? '');

  const [inspeccao, setInspeccao] = useState<InspeccaoQualidade | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResultado, setSelectedResultado] = useState<InspeccaoResultado | null>(null);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    qualityApi.getById(id).then(data => {
      setInspeccao(data);
      if (data.resultado) setSelectedResultado(data.resultado);
      if (data.observacoes) setObservacoes(data.observacoes);
    });
  }, [id]);

  if (!inspeccao) return <LoadingOverlay visible message="A carregar inspeção..." />;

  const handleRegistarResultado = () => {
    if (!selectedResultado) { Alert.alert('Erro', 'Selecione um resultado'); return; }
    Alert.alert('Registar Resultado', `Confirma o resultado: "${selectedResultado}"?`, [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Confirmar',
        onPress: async () => {
          setIsLoading(true);
          try {
            const updated = await qualityApi.registarResultado(id, selectedResultado, observacoes);
            setInspeccao(updated);
          } finally { setIsLoading(false); }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header title={inspeccao.referencia} subtitle={inspeccao.tipo === 'intermedia' ? 'Inspeção Intermédia' : 'Inspeção Final'} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Card style={styles.statusCard}>
          <View style={styles.row}>
            <Badge status={inspeccao.tipo === 'intermedia' ? 'em_analise' : 'pendente'} />
            {inspeccao.resultado && <Badge status={inspeccao.resultado} />}
          </View>
          <Text style={styles.op}>Ordem de Produção #{inspeccao.ordemProducaoId}</Text>
          <Text style={styles.inspector}>Inspector: {inspeccao.inspector}</Text>
          <Text style={styles.date}>{new Date(inspeccao.dataInspeccao).toLocaleDateString('pt-PT')}</Text>
        </Card>

        {inspeccao.observacoes && (
          <Card>
            <Text style={styles.cardTitle}>Observações</Text>
            <Text style={styles.obsText}>{inspeccao.observacoes}</Text>
          </Card>
        )}

        {/* Registar resultado */}
        {isQualidade && !inspeccao.resultado && (
          <Card>
            <Text style={styles.cardTitle}>Registar Resultado</Text>
            <View style={styles.resultadoGrid}>
              {RESULTADOS.map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.resultadoBtn, selectedResultado === r.value && {backgroundColor: r.color, borderColor: r.color}]}
                  onPress={() => setSelectedResultado(r.value)}>
                  <Text style={[styles.resultadoText, selectedResultado === r.value && styles.resultadoTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button label="Registar Resultado" onPress={handleRegistarResultado} loading={isLoading} fullWidth style={styles.btn} />
          </Card>
        )}

        {/* Não conformidades */}
        <View style={styles.ncSection}>
          <View style={styles.ncHeader}>
            <Text style={styles.cardTitle}>Não Conformidades</Text>
            {isQualidade && (
              <TouchableOpacity
                style={styles.addNcBtn}
                onPress={() => navigation.navigate('CreateNaoConformidade', {inspeccaoId: id})}>
                <Text style={styles.addNcText}>+ Adicionar</Text>
              </TouchableOpacity>
            )}
          </View>
          {(!inspeccao.naoConformidades || inspeccao.naoConformidades.length === 0) ? (
            <Card><Text style={styles.emptyNc}>Nenhuma não conformidade registada</Text></Card>
          ) : (
            inspeccao.naoConformidades.map(nc => (
              <Card key={nc.id} style={styles.ncCard}>
                <View style={styles.row}>
                  <Badge status={nc.gravidade} />
                  <Badge status={nc.status} />
                </View>
                <Text style={styles.ncDesc}>{nc.descricao}</Text>
                {nc.acaoCorretiva && (
                  <View style={styles.acaoWrap}>
                    <Text style={styles.acaoLabel}>Ação corretiva:</Text>
                    <Text style={styles.acaoText}>{nc.acaoCorretiva}</Text>
                  </View>
                )}
              </Card>
            ))
          )}
        </View>
      </ScrollView>
      {isLoading && <LoadingOverlay visible message="A processar..." />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  content: {padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl']},
  statusCard: {gap: Spacing.sm},
  row: {flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap'},
  op: {fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.medium as any},
  inspector: {fontSize: FontSize.sm, color: Colors.gray600},
  date: {fontSize: FontSize.xs, color: Colors.gray400},
  cardTitle: {fontSize: FontSize.base, fontWeight: FontWeight.semibold as any, color: Colors.gray800, marginBottom: Spacing.md},
  obsText: {fontSize: FontSize.base, color: Colors.gray700, lineHeight: 22},
  resultadoGrid: {gap: Spacing.sm, marginBottom: Spacing.md},
  resultadoBtn: {padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center'},
  resultadoText: {fontSize: FontSize.base, fontWeight: FontWeight.medium as any, color: Colors.gray700},
  resultadoTextActive: {color: Colors.white},
  btn: {marginTop: Spacing.sm},
  ncSection: {gap: Spacing.sm},
  ncHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  addNcBtn: {backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: Spacing.sm},
  addNcText: {color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold as any},
  emptyNc: {fontSize: FontSize.sm, color: Colors.gray400, textAlign: 'center'},
  ncCard: {gap: Spacing.sm},
  ncDesc: {fontSize: FontSize.base, color: Colors.gray800},
  acaoWrap: {backgroundColor: Colors.successLight, borderRadius: BorderRadius.md, padding: Spacing.sm},
  acaoLabel: {fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.semibold as any},
  acaoText: {fontSize: FontSize.sm, color: Colors.gray700},
});
