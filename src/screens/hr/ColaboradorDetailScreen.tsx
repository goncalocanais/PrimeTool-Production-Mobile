import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {Header, Card, LoadingOverlay} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {Colaborador} from '../../types';
import {hrApi} from '../../api/hr';

const PERFIL_LABELS: Record<string, string> = {
  direcao: 'Direção', rh: 'RH', planeamento: 'Planeamento',
  armazem: 'Armazém', producao: 'Produção', qualidade: 'Qualidade',
  expedicao: 'Expedição', montagem: 'Montagem',
};

export const ColaboradorDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const {id} = route.params;
  const [colaborador, setColaborador] = useState<Colaborador | null>(null);

  useEffect(() => { hrApi.getColaboradorById(id).then(setColaborador); }, [id]);

  if (!colaborador) return <LoadingOverlay visible message="A carregar colaborador..." />;

  return (
    <View style={styles.container}>
      <Header title={colaborador.nome} subtitle={colaborador.cargo} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{colaborador.nome.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.nome}>{colaborador.nome}</Text>
          <Text style={styles.cargo}>{colaborador.cargo}</Text>
          <View style={[styles.perfilBadge, !colaborador.ativo && styles.perfilBadgeInativo]}>
            <Text style={styles.perfilText}>{PERFIL_LABELS[colaborador.perfil] ?? colaborador.perfil}</Text>
          </View>
          {!colaborador.ativo && <Text style={styles.inativo}>Conta Inativa</Text>}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Informações de Contacto</Text>
          {(
            [
              ['Email', colaborador.email],
              ...(colaborador.telefone ? [['Telefone', colaborador.telefone]] : []),
            ] as [string, string][]
          ).map(([label, value]) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Dados Profissionais</Text>
          {[
            ['Departamento', colaborador.departamento?.nome ?? `Dept. #${colaborador.departamentoId}`],
            ['Cargo', colaborador.cargo],
            ['Perfil de Acesso', PERFIL_LABELS[colaborador.perfil] ?? colaborador.perfil],
            ['Data Admissão', new Date(colaborador.dataAdmissao).toLocaleDateString('pt-PT')],
          ].map(([label, value]) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  content: {padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl']},
  profileCard: {alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl},
  avatar: {width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center'},
  avatarText: {fontSize: 36, fontWeight: FontWeight.bold as any, color: Colors.white},
  nome: {fontSize: FontSize.xl, fontWeight: FontWeight.bold as any, color: Colors.gray900},
  cargo: {fontSize: FontSize.base, color: Colors.gray600},
  perfilBadge: {backgroundColor: Colors.primaryUltraLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: BorderRadius.full},
  perfilBadgeInativo: {backgroundColor: Colors.gray100},
  perfilText: {fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold as any},
  inativo: {fontSize: FontSize.sm, color: Colors.danger, fontWeight: FontWeight.medium as any},
  cardTitle: {fontSize: FontSize.base, fontWeight: FontWeight.semibold as any, color: Colors.gray800, marginBottom: Spacing.md},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.gray100},
  infoLabel: {fontSize: FontSize.sm, color: Colors.gray500},
  infoValue: {fontSize: FontSize.sm, color: Colors.gray800, fontWeight: FontWeight.medium as any, maxWidth: '55%', textAlign: 'right'},
});
