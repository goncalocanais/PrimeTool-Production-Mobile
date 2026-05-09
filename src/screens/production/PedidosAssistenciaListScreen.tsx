import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, RefreshControl} from 'react-native';
import {Header, Card, Badge, EmptyState} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight} from '../../theme';
import {PedidoAssistencia} from '../../types';
import {ordersApi} from '../../api/orders';

export const PedidosAssistenciaListScreen: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoAssistencia[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await ordersApi.getPedidosAssistencia();
      setPedidos(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Pedidos de Assistência" showBack />
      <FlatList
        data={pedidos}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState title="Nenhum pedido de assistência" description="Ainda não foram registados pedidos." />
        }
        renderItem={({item}) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.titulo} numberOfLines={1}>{item.titulo}</Text>
              <Badge status={item.status} />
            </View>
            <Text style={styles.desc} numberOfLines={2}>{item.descricao}</Text>
            <View style={styles.footer}>
              <Badge status={item.prioridade} />
              <Text style={styles.date}>
                {new Date(item.solicitadoEm).toLocaleDateString('pt-PT')}
              </Text>
            </View>
            {item.resposta && (
              <View style={styles.respostaBox}>
                <Text style={styles.respostaLabel}>Resposta:</Text>
                <Text style={styles.respostaText}>{item.resposta}</Text>
              </View>
            )}
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
  titulo: {fontSize: FontSize.base, fontWeight: FontWeight.semibold as any, color: Colors.gray900, flex: 1, marginRight: Spacing.sm},
  desc: {fontSize: FontSize.sm, color: Colors.gray500, lineHeight: 18},
  footer: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  date: {fontSize: FontSize.xs, color: Colors.gray400},
  respostaBox: {
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    padding: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  respostaLabel: {fontSize: FontSize.xs, fontWeight: FontWeight.semibold as any, color: Colors.success, marginBottom: 2},
  respostaText: {fontSize: FontSize.sm, color: Colors.gray700},
});
