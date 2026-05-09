import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Header, Card, Badge, EmptyState, OfflineBanner} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight} from '../../theme';
import {Expedicao} from '../../types';
import {expeditionApi} from '../../api/expedition';
import {useAppSelector} from '../../store';

export const ExpedicoesListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const user = useAppSelector(s => s.auth.user);
  const canCreate = ['expedicao', 'direcao'].includes(user?.perfil ?? '');

  const [expedicoes, setExpedicoes] = useState<Expedicao[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try { setExpedicoes(await expeditionApi.getAll()); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <View style={styles.container}>
      <Header
        title="Expedições"
        rightAction={canCreate ? (
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreateExpedicao', {})}>
            <Text style={styles.addBtnText}>+ Nova</Text>
          </TouchableOpacity>
        ) : undefined}
      />
      <OfflineBanner />
      <FlatList
        data={expedicoes}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />}
        ListEmptyComponent={<EmptyState title="Sem expedições" description="Não existem expedições registadas." />}
        renderItem={({item}) => (
          <Card onPress={() => navigation.navigate('ExpedicaoDetail', {id: item.id})} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.ref}>{item.referencia}</Text>
              <Badge status={item.status} />
            </View>
            <Text style={styles.dest}>📍 {item.destinatario}</Text>
            <Text style={styles.morada} numberOfLines={1}>{item.moradaEntrega}</Text>
            {item.transportadora && <Text style={styles.meta}>🚚 {item.transportadora}</Text>}
            {item.guiaTransporte && <Text style={styles.meta}>📄 Guia: {item.guiaTransporte}</Text>}
            <View style={styles.footer}>
              <Text style={styles.op}>OP #{item.ordemProducaoId}</Text>
              {item.dataPrevisaoEntrega && (
                <Text style={styles.date}>📅 {new Date(item.dataPrevisaoEntrega).toLocaleDateString('pt-PT')}</Text>
              )}
            </View>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  addBtn: {backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20},
  addBtnText: {color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold as any},
  list: {padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl']},
  card: {gap: Spacing.sm},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  ref: {fontSize: FontSize.base, fontWeight: FontWeight.bold as any, color: Colors.gray900},
  dest: {fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.medium as any},
  morada: {fontSize: FontSize.sm, color: Colors.gray500},
  meta: {fontSize: FontSize.sm, color: Colors.gray600},
  footer: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  op: {fontSize: FontSize.xs, color: Colors.primaryLight, fontWeight: FontWeight.medium as any},
  date: {fontSize: FontSize.xs, color: Colors.gray400},
});
