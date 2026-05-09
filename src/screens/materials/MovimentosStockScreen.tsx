import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, RefreshControl} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {Header, Card, EmptyState} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {MovimentoStock} from '../../types';
import {materialsApi} from '../../api/materials';

const TIPO_CONFIG: Record<string, {icon: string; color: string}> = {
  entrada: {icon: '📥', color: Colors.success},
  saida: {icon: '📤', color: Colors.danger},
  ajuste: {icon: '🔧', color: Colors.warning},
  transferencia: {icon: '↔️', color: Colors.info},
};

export const MovimentosStockScreen: React.FC = () => {
  const route = useRoute<any>();
  const {materialId} = route.params ?? {};
  const [movimentos, setMovimentos] = useState<MovimentoStock[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await materialsApi.getMovimentos(materialId);
      setMovimentos(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <View style={styles.container}>
      <Header title="Movimentos de Stock" showBack />
      <FlatList
        data={movimentos}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />}
        ListEmptyComponent={<EmptyState title="Sem movimentos" description="Não existem movimentos registados." />}
        renderItem={({item}) => {
          const config = TIPO_CONFIG[item.tipo] ?? {icon: '📋', color: Colors.gray500};
          return (
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={[styles.iconWrap, {backgroundColor: config.color + '20'}]}>
                  <Text style={styles.icon}>{config.icon}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.tipo}>{item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}</Text>
                  <Text style={styles.utilizador}>{item.utilizador}</Text>
                  {item.motivo && <Text style={styles.motivo} numberOfLines={1}>{item.motivo}</Text>}
                </View>
                <View style={styles.qtdWrap}>
                  <Text style={[styles.qtd, {color: config.color}]}>
                    {item.tipo === 'entrada' ? '+' : item.tipo === 'saida' ? '-' : '~'}{item.quantidade}
                  </Text>
                  <Text style={styles.qtdMeta}>{item.quantidadeAnterior} → {item.quantidadeApos}</Text>
                </View>
              </View>
              <Text style={styles.date}>{new Date(item.data).toLocaleString('pt-PT')}</Text>
            </Card>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  list: {padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl']},
  card: {gap: Spacing.sm},
  row: {flexDirection: 'row', alignItems: 'center', gap: Spacing.md},
  iconWrap: {width: 40, height: 40, borderRadius: BorderRadius.md, alignItems: 'center', justifyContent: 'center'},
  icon: {fontSize: 20},
  info: {flex: 1},
  tipo: {fontSize: FontSize.base, fontWeight: FontWeight.semibold as any, color: Colors.gray900},
  utilizador: {fontSize: FontSize.sm, color: Colors.gray500},
  motivo: {fontSize: FontSize.xs, color: Colors.gray400, fontStyle: 'italic'},
  qtdWrap: {alignItems: 'flex-end'},
  qtd: {fontSize: FontSize.lg, fontWeight: FontWeight.bold as any},
  qtdMeta: {fontSize: FontSize.xs, color: Colors.gray400},
  date: {fontSize: FontSize.xs, color: Colors.gray400},
});
