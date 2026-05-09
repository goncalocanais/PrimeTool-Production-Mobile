import React, {useEffect, useCallback} from 'react';
import {View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '../../store';
import {fetchPedidosMaterial, responderPedidoMaterial} from '../../store/slices/materialsSlice';
import {Header, Card, Badge, EmptyState, Button, OfflineBanner} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight} from '../../theme';
import {PedidoMaterial} from '../../types';

export const PedidosMaterialListScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const {pedidosMaterial, isLoading} = useAppSelector(s => s.materials);
  const user = useAppSelector(s => s.auth.user);
  const isArmazem = ['armazem', 'direcao'].includes(user?.perfil ?? '');

  const load = useCallback(() => {
    dispatch(fetchPedidosMaterial());
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const handleResponder = (pedido: PedidoMaterial, status: 'aprovado' | 'rejeitado') => {
    Alert.alert(
      status === 'aprovado' ? 'Aprovar Pedido' : 'Rejeitar Pedido',
      `Confirma que pretende ${status === 'aprovado' ? 'aprovar' : 'rejeitar'} este pedido?`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Confirmar',
          onPress: () => dispatch(responderPedidoMaterial({id: pedido.id, status})),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Pedidos de Material"
        showBack
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreatePedidoMaterial', {})}>
            <Text style={styles.addBtnText}>+ Novo</Text>
          </TouchableOpacity>
        }
      />
      <OfflineBanner />

      <FlatList
        data={pedidosMaterial}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState title="Nenhum pedido de material" description="Ainda não existem pedidos registados." />
        }
        renderItem={({item}) => (
          <Card style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.ref}>{item.referencia}</Text>
              <Badge status={item.status} />
            </View>
            <Text style={styles.material}>{item.material?.nome ?? `Material #${item.materialId}`}</Text>
            <Text style={styles.detail}>Qtd: {item.quantidade} · OP: {item.ordemProducao?.referencia ?? `#${item.ordemProducaoId}`}</Text>
            <Text style={styles.justificacao} numberOfLines={2}>{item.justificacao}</Text>
            <Text style={styles.date}>
              Solicitado por {item.solicitadoPor} em {new Date(item.solicitadoEm).toLocaleDateString('pt-PT')}
            </Text>

            {isArmazem && item.status === 'pendente' && (
              <View style={styles.actions}>
                <Button label="Aprovar" onPress={() => handleResponder(item, 'aprovado')} size="sm" style={styles.approveBtn} />
                <Button label="Rejeitar" onPress={() => handleResponder(item, 'rejeitado')} variant="danger" size="sm" />
              </View>
            )}

            {item.observacaoResposta && (
              <View style={styles.resposta}>
                <Text style={styles.respostaText}>{item.observacaoResposta}</Text>
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
  addBtn: {backgroundColor: Colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20},
  addBtnText: {color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold as any},
  list: {padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl']},
  card: {gap: Spacing.sm},
  row: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  ref: {fontSize: FontSize.base, fontWeight: FontWeight.bold as any, color: Colors.gray900},
  material: {fontSize: FontSize.base, color: Colors.primary, fontWeight: FontWeight.medium as any},
  detail: {fontSize: FontSize.sm, color: Colors.gray600},
  justificacao: {fontSize: FontSize.sm, color: Colors.gray500, fontStyle: 'italic'},
  date: {fontSize: FontSize.xs, color: Colors.gray400},
  actions: {flexDirection: 'row', gap: Spacing.sm},
  approveBtn: {flex: 1},
  resposta: {backgroundColor: Colors.gray50, borderRadius: 8, padding: Spacing.sm},
  respostaText: {fontSize: FontSize.sm, color: Colors.gray700},
});
