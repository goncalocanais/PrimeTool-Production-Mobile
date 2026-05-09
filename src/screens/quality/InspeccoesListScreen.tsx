import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Header, Card, Badge, EmptyState, OfflineBanner} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {InspeccaoQualidade} from '../../types';
import {qualityApi} from '../../api/quality';

const RESULTADO_CONFIG: Record<string, {icon: string; color: string}> = {
  aprovado: {icon: '✅', color: Colors.success},
  reprovado: {icon: '❌', color: Colors.danger},
  aprovado_com_ressalvas: {icon: '⚠️', color: Colors.warning},
};

export const InspeccoesListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [inspeccoes, setInspeccoes] = useState<InspeccaoQualidade[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try { setInspeccoes(await qualityApi.getInspeccoes()); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={styles.container}>
      <Header
        title="Controlo de Qualidade"
        rightAction={
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('NaoConformidadesList')}>
            <Text style={styles.addBtnText}>NC's</Text>
          </TouchableOpacity>
        }
      />
      <OfflineBanner />
      <FlatList
        data={inspeccoes}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />}
        ListEmptyComponent={<EmptyState title="Sem inspeções" description="Ainda não existem inspeções registadas." />}
        renderItem={({item}) => {
          const res = item.resultado ? RESULTADO_CONFIG[item.resultado] : null;
          return (
            <Card onPress={() => navigation.navigate('InspeccaoDetail', {id: item.id})} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.left}>
                  <Text style={styles.ref}>{item.referencia}</Text>
                  <Text style={styles.tipo}>{item.tipo === 'intermedia' ? 'Intermédia' : 'Final'}</Text>
                </View>
                {res ? (
                  <View style={styles.resultadoWrap}>
                    <Text style={styles.resultadoIcon}>{res.icon}</Text>
                    <Badge status={item.resultado!} />
                  </View>
                ) : (
                  <Badge status="pendente" />
                )}
              </View>
              <Text style={styles.op}>OP #{item.ordemProducaoId}</Text>
              <View style={styles.footer}>
                <Text style={styles.inspector}>👤 {item.inspector}</Text>
                <Text style={styles.date}>{new Date(item.dataInspeccao).toLocaleDateString('pt-PT')}</Text>
              </View>
              {item.naoConformidades && item.naoConformidades.length > 0 && (
                <View style={styles.ncBadge}>
                  <Text style={styles.ncText}>⚠️ {item.naoConformidades.length} não conformidade(s)</Text>
                </View>
              )}
            </Card>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  addBtn: {backgroundColor: Colors.warning, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20},
  addBtnText: {color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold as any},
  list: {padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl']},
  card: {gap: Spacing.sm},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  left: {flex: 1},
  ref: {fontSize: FontSize.base, fontWeight: FontWeight.bold as any, color: Colors.gray900},
  tipo: {fontSize: FontSize.xs, color: Colors.gray500, marginTop: 2},
  resultadoWrap: {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm},
  resultadoIcon: {fontSize: 18},
  op: {fontSize: FontSize.sm, color: Colors.primaryLight, fontWeight: FontWeight.medium as any},
  footer: {flexDirection: 'row', justifyContent: 'space-between'},
  inspector: {fontSize: FontSize.xs, color: Colors.gray500},
  date: {fontSize: FontSize.xs, color: Colors.gray400},
  ncBadge: {backgroundColor: Colors.dangerLight, borderRadius: BorderRadius.md, padding: Spacing.sm},
  ncText: {fontSize: FontSize.xs, color: Colors.danger, fontWeight: FontWeight.semibold as any},
});
