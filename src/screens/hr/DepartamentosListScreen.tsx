import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, RefreshControl} from 'react-native';
import {Header, Card, EmptyState} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight} from '../../theme';
import {Departamento} from '../../types';
import {hrApi} from '../../api/hr';

export const DepartamentosListScreen: React.FC = () => {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try { setDepartamentos(await hrApi.getDepartamentos()); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={styles.container}>
      <Header title="Departamentos" showBack />
      <FlatList
        data={departamentos}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />}
        ListEmptyComponent={<EmptyState title="Sem departamentos" />}
        renderItem={({item}) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <Text style={styles.icon}>🏢</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.nome}>{item.nome}</Text>
                {item.responsavel && <Text style={styles.resp}>Responsável: {item.responsavel}</Text>}
              </View>
              <View style={styles.countWrap}>
                <Text style={styles.count}>{item.totalColaboradores}</Text>
                <Text style={styles.countLabel}>colab.</Text>
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  list: {padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl']},
  card: {},
  row: {flexDirection: 'row', alignItems: 'center', gap: Spacing.md},
  iconWrap: {width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryUltraLight, alignItems: 'center', justifyContent: 'center'},
  icon: {fontSize: 22},
  info: {flex: 1},
  nome: {fontSize: FontSize.base, fontWeight: FontWeight.semibold as any, color: Colors.gray900},
  resp: {fontSize: FontSize.sm, color: Colors.gray500},
  countWrap: {alignItems: 'center'},
  count: {fontSize: FontSize.xl, fontWeight: FontWeight.bold as any, color: Colors.primary},
  countLabel: {fontSize: FontSize.xs, color: Colors.gray400},
});
