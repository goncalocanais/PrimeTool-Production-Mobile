import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, RefreshControl} from 'react-native';
import {Header, Card, Badge, EmptyState} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight} from '../../theme';
import {NaoConformidade} from '../../types';
import {qualityApi} from '../../api/quality';

const GRAVIDADE_ICON: Record<string, string> = {menor: '🟡', maior: '🟠', critica: '🔴'};

export const NaoConformidadesListScreen: React.FC = () => {
  const [ncs, setNcs] = useState<NaoConformidade[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try { setNcs(await qualityApi.getNaoConformidades()); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={styles.container}>
      <Header title="Não Conformidades" showBack />
      <FlatList
        data={ncs}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />}
        ListEmptyComponent={<EmptyState title="Sem não conformidades" description="Não existem NC's registadas." />}
        renderItem={({item}) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.left}>
                <Text style={styles.gravIcon}>{GRAVIDADE_ICON[item.gravidade]} </Text>
                <Badge status={item.gravidade} />
              </View>
              <Badge status={item.status} />
            </View>
            <Text style={styles.desc}>{item.descricao}</Text>
            {item.acaoCorretiva && (
              <View style={styles.acaoWrap}>
                <Text style={styles.acaoLabel}>Ação corretiva:</Text>
                <Text style={styles.acaoText} numberOfLines={2}>{item.acaoCorretiva}</Text>
              </View>
            )}
            {item.responsavel && <Text style={styles.resp}>👤 {item.responsavel}</Text>}
            {item.prazo && <Text style={styles.prazo}>📅 Prazo: {new Date(item.prazo).toLocaleDateString('pt-PT')}</Text>}
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  list: {padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl']},
  card: {gap: Spacing.sm},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  left: {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm},
  gravIcon: {fontSize: 18},
  desc: {fontSize: FontSize.base, color: Colors.gray800, lineHeight: 22},
  acaoWrap: {backgroundColor: Colors.successLight, borderRadius: 8, padding: Spacing.sm},
  acaoLabel: {fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.semibold as any},
  acaoText: {fontSize: FontSize.sm, color: Colors.gray700},
  resp: {fontSize: FontSize.sm, color: Colors.gray500},
  prazo: {fontSize: FontSize.sm, color: Colors.gray500},
});
