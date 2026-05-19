import React, {useEffect, useState, useCallback} from 'react';
import {View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, RefreshControl} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '../../store';
import {fetchMaterials, fetchAlertasStock} from '../../store/slices/materialsSlice';
import {Header, Card, EmptyState, OfflineBanner} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {Material} from '../../types';

const MaterialCard: React.FC<{material: Material; onPress: () => void}> = ({material, onPress}) => {
  const isLow = material.stockAtual <= material.stockMinimo;
  const isOut = material.stockAtual === 0;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.codigo}>{material.codigo}</Text>
          <Text style={styles.nome} numberOfLines={1}>{material.nome}</Text>
        </View>
        <View style={styles.stockBadge}>
          <Text style={[styles.stockValue, isOut ? styles.stockOut : isLow ? styles.stockLow : styles.stockOk]}>
            {material.stockAtual}
          </Text>
          <Text style={styles.unidade}>{material.unidade}</Text>
        </View>
      </View>

      {/* Stock bar */}
      <View style={styles.stockBar}>
        <View
          style={[
            styles.stockFill,
            {
              width: material.stockMinimo > 0
                ? `${Math.min(100, (material.stockAtual / (material.stockMinimo * 4)) * 100)}%`
                : '100%',
              backgroundColor: isOut ? Colors.danger : isLow ? Colors.warning : Colors.success,
            },
          ]}
        />
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.stockMin}>Mín: {material.stockMinimo} {material.unidade}</Text>
        {material.localizacao && <Text style={styles.localizacao}>📍 {material.localizacao}</Text>}
        {isLow && !isOut && <Text style={styles.alertText}>⚠️ Stock mínimo</Text>}
        {isOut && <Text style={styles.outText}>🚫 Sem stock</Text>}
      </View>
    </Card>
  );
};

export const MaterialsListScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const {materials, isLoading} = useAppSelector(s => s.materials);
  const user = useAppSelector(s => s.auth.user);

  const [search, setSearch] = useState('');
  const [showAlertas, setShowAlertas] = useState(false);

  const canManage = ['armazem', 'direcao'].includes(user?.perfil ?? '');

  const loadData = useCallback(() => {
    dispatch(fetchMaterials());
    dispatch(fetchAlertasStock());
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = materials.filter(m => {
    const matchSearch =
      !search ||
      m.codigo.toLowerCase().includes(search.toLowerCase()) ||
      m.nome.toLowerCase().includes(search.toLowerCase());
    const matchAlerta = !showAlertas || m.stockAtual <= m.stockMinimo;
    return matchSearch && matchAlerta;
  });

  return (
    <View style={styles.container}>
      <Header
        title="Materiais & Stock"
        rightAction={
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.navigate('PedidosMaterialList')}>
            <Text style={styles.menuBtnText}>Pedidos</Text>
          </TouchableOpacity>
        }
      />
      <OfflineBanner />

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Código ou nome do material..."
          placeholderTextColor={Colors.gray400}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, showAlertas && styles.filterBtnActive]}
          onPress={() => setShowAlertas(!showAlertas)}>
          <Text style={[styles.filterBtnText, showAlertas && styles.filterBtnTextActive]}>
            ⚠️ Apenas alertas
          </Text>
        </TouchableOpacity>

        {canManage && (
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => navigation.navigate('MovimentosStock', {})}>
            <Text style={styles.filterBtnText}>📊 Movimentos</Text>
          </TouchableOpacity>
        )}

      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            title="Nenhum material encontrado"
            description={showAlertas ? 'Não há materiais em alerta de stock' : 'O stock está vazio'}
          />
        }
        renderItem={({item}) => (
          <MaterialCard
            material={item}
            onPress={() => navigation.navigate('MaterialDetail', {id: item.id})}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  searchRow: {padding: Spacing.base, paddingBottom: Spacing.sm},
  searchInput: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.base,
    color: Colors.gray900,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  filterBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filterBtnActive: {backgroundColor: Colors.warning, borderColor: Colors.warning},
  filterBtnText: {fontSize: FontSize.sm, color: Colors.gray600, fontWeight: FontWeight.medium as any},
  filterBtnTextActive: {color: Colors.white},
  menuBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  menuBtnText: {color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.semibold as any},
  list: {padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl']},
  card: {gap: Spacing.sm},
  cardHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  codigo: {fontSize: FontSize.xs, color: Colors.primaryLight, fontWeight: FontWeight.semibold as any},
  nome: {fontSize: FontSize.base, fontWeight: FontWeight.semibold as any, color: Colors.gray900, maxWidth: 200},
  stockBadge: {alignItems: 'flex-end'},
  stockValue: {fontSize: FontSize.xl, fontWeight: FontWeight.bold as any},
  stockOk: {color: Colors.success},
  stockLow: {color: Colors.warning},
  stockOut: {color: Colors.danger},
  unidade: {fontSize: FontSize.xs, color: Colors.gray500},
  stockBar: {height: 5, backgroundColor: Colors.gray100, borderRadius: BorderRadius.full, overflow: 'hidden'},
  stockFill: {height: '100%', borderRadius: BorderRadius.full},
  cardFooter: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4},
  stockMin: {fontSize: FontSize.xs, color: Colors.gray500},
  localizacao: {fontSize: FontSize.xs, color: Colors.gray500},
  alertText: {fontSize: FontSize.xs, color: Colors.warning, fontWeight: FontWeight.semibold as any},
  outText: {fontSize: FontSize.xs, color: Colors.danger, fontWeight: FontWeight.semibold as any},
});
