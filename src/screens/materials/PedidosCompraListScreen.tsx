import React, {useEffect, useCallback} from 'react';
import {View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '../../store';
import {fetchPedidosCompra} from '../../store/slices/materialsSlice';
import {Header, Card, Badge, EmptyState} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight} from '../../theme';

export const PedidosCompraListScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const {pedidosCompra, isLoading} = useAppSelector(s => s.materials);
  const user = useAppSelector(s => s.auth.user);
  const canCreate = ['armazem', 'direcao'].includes(user?.perfil ?? '');

  const load = useCallback(() => { dispatch(fetchPedidosCompra()); }, [dispatch]);
  useEffect(() => { load(); }, [load]);

  return (
    <View style={styles.container}>
      <Header
        title="Pedidos de Compra"
        showBack
        rightAction={canCreate ? (
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CreatePedidoCompra')}>
            <Text style={styles.addBtnText}>+ Novo</Text>
          </TouchableOpacity>
        ) : undefined}
      />
      <FlatList
        data={pedidosCompra}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />}
        ListEmptyComponent={<EmptyState title="Sem pedidos de compra" description="Ainda não existem pedidos de compra." />}
        renderItem={({item}) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.ref}>{item.referencia}</Text>
              <Badge status={item.status} />
            </View>
            <Text style={styles.fornecedor}>{item.fornecedor}</Text>
            <Text style={styles.material}>{item.material?.nome ?? `Material #${item.materialId}`}</Text>
            <View style={styles.footer}>
              <Text style={styles.qty}>Qtd: {item.quantidade} · Recebido: {item.quantidadeRecebida}</Text>
              <Text style={styles.date}>{new Date(item.dataPedido).toLocaleDateString('pt-PT')}</Text>
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
  fornecedor: {fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.medium as any},
  material: {fontSize: FontSize.sm, color: Colors.gray600},
  footer: {flexDirection: 'row', justifyContent: 'space-between'},
  qty: {fontSize: FontSize.sm, color: Colors.gray600},
  date: {fontSize: FontSize.xs, color: Colors.gray400},
});
