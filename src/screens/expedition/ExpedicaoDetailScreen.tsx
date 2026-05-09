import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, Alert} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {useAppSelector} from '../../store';
import {Header, Card, Badge, Button, Input, LoadingOverlay} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight} from '../../theme';
import {Expedicao} from '../../types';
import {expeditionApi} from '../../api/expedition';

export const ExpedicaoDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const {id} = route.params;
  const user = useAppSelector(s => s.auth.user);
  const isExpedicao = ['expedicao', 'direcao'].includes(user?.perfil ?? '');

  const [expedicao, setExpedicao] = useState<Expedicao | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transportadora, setTransportadora] = useState('');
  const [guia, setGuia] = useState('');
  const [showEnvio, setShowEnvio] = useState(false);

  useEffect(() => {
    expeditionApi.getById(id).then(data => {
      setExpedicao(data);
      if (data.transportadora) setTransportadora(data.transportadora);
      if (data.guiaTransporte) setGuia(data.guiaTransporte);
    });
  }, [id]);

  if (!expedicao) return <LoadingOverlay visible message="A carregar expedição..." />;

  const handleAvancar = (newStatus: string, label: string) => {
    Alert.alert('Atualizar Estado', `Confirma: "${label}"?`, [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Confirmar',
        onPress: async () => {
          setIsLoading(true);
          try {
            const updated = await expeditionApi.updateStatus(id, newStatus);
            setExpedicao(updated);
          } finally { setIsLoading(false); }
        },
      },
    ]);
  };

  const handleRegistarEnvio = async () => {
    if (!transportadora.trim() || !guia.trim()) { Alert.alert('Erro', 'Preencha a transportadora e a guia'); return; }
    setIsLoading(true);
    try {
      const updated = await expeditionApi.registarEnvio(id, transportadora, guia);
      setExpedicao(updated);
      setShowEnvio(false);
    } finally { setIsLoading(false); }
  };

  const rows: [string, string][] = [
    ['Referência', expedicao.referencia],
    ['Destinatário', expedicao.destinatario],
    ['Morada', expedicao.moradaEntrega],
    ...(expedicao.transportadora ? [['Transportadora', expedicao.transportadora] as [string, string]] : []),
    ...(expedicao.guiaTransporte ? [['Guia de Transporte', expedicao.guiaTransporte] as [string, string]] : []),
    ...(expedicao.peso ? [['Peso', `${expedicao.peso} kg`] as [string, string]] : []),
    ...(expedicao.volumes ? [['Volumes', expedicao.volumes.toString()] as [string, string]] : []),
    ...(expedicao.dataPrevisaoEntrega ? [['Previsão Entrega', new Date(expedicao.dataPrevisaoEntrega).toLocaleDateString('pt-PT')] as [string, string]] : []),
    ...(expedicao.dataEnvio ? [['Data Envio', new Date(expedicao.dataEnvio).toLocaleDateString('pt-PT')] as [string, string]] : []),
    ...(expedicao.dataEntrega ? [['Data Entrega', new Date(expedicao.dataEntrega).toLocaleDateString('pt-PT')] as [string, string]] : []),
  ];

  return (
    <View style={styles.container}>
      <Header title={expedicao.referencia} subtitle="Detalhe de Expedição" showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Card style={styles.statusCard}>
          <Badge status={expedicao.status} />
          <Text style={styles.op}>Ordem de Produção #{expedicao.ordemProducaoId}</Text>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Informações</Text>
          {rows.map(([label, value]) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </Card>

        {expedicao.observacoes && (
          <Card>
            <Text style={styles.cardTitle}>Observações</Text>
            <Text style={styles.obs}>{expedicao.observacoes}</Text>
          </Card>
        )}

        {isExpedicao && (
          <View style={styles.actions}>
            {expedicao.status === 'pendente' && (
              <Button label="Iniciar Preparação" onPress={() => handleAvancar('em_preparacao', 'Iniciar Preparação')} fullWidth />
            )}
            {expedicao.status === 'em_preparacao' && (
              <Button label="Marcar como Pronto" onPress={() => handleAvancar('pronto', 'Marcar como Pronto')} fullWidth />
            )}
            {expedicao.status === 'pronto' && (
              <>
                <Button label="Registar Envio" onPress={() => setShowEnvio(!showEnvio)} variant={showEnvio ? 'outline' : 'primary'} fullWidth />
                {showEnvio && (
                  <Card>
                    <Input label="Transportadora" value={transportadora} onChangeText={setTransportadora} placeholder="Nome da transportadora" />
                    <Input label="Guia de Transporte" value={guia} onChangeText={setGuia} placeholder="Número da guia" />
                    <Button label="Confirmar Envio" onPress={handleRegistarEnvio} loading={isLoading} fullWidth />
                  </Card>
                )}
              </>
            )}
            {expedicao.status === 'enviado' && (
              <Button label="Confirmar Entrega" onPress={() => handleAvancar('entregue', 'Confirmar Entrega')} fullWidth />
            )}
          </View>
        )}
      </ScrollView>
      {isLoading && <LoadingOverlay visible message="A processar..." />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  content: {padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl']},
  statusCard: {gap: Spacing.sm},
  op: {fontSize: FontSize.sm, color: Colors.primaryLight, fontWeight: FontWeight.medium as any},
  cardTitle: {fontSize: FontSize.base, fontWeight: FontWeight.semibold as any, color: Colors.gray800, marginBottom: Spacing.md},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.gray100},
  infoLabel: {fontSize: FontSize.sm, color: Colors.gray500},
  infoValue: {fontSize: FontSize.sm, color: Colors.gray800, fontWeight: FontWeight.medium as any, maxWidth: '55%', textAlign: 'right'},
  obs: {fontSize: FontSize.base, color: Colors.gray700, lineHeight: 22},
  actions: {gap: Spacing.sm},
});
