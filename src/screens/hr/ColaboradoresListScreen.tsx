import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, StyleSheet, TextInput, RefreshControl, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAppSelector} from '../../store';
import {Header, Card, EmptyState, OfflineBanner} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {Colaborador} from '../../types';
import {hrApi} from '../../api/hr';

const PERFIL_LABELS: Record<string, string> = {
  direcao: 'Direção', rh: 'RH', planeamento: 'Planeamento',
  armazem: 'Armazém', producao: 'Produção', qualidade: 'Qualidade',
  expedicao: 'Expedição', montagem: 'Montagem',
};

export const ColaboradoresListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const user = useAppSelector(s => s.auth.user);
  const canCreate = ['rh', 'direcao'].includes(user?.perfil ?? '');

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setIsLoading(true);
    try { setColaboradores(await hrApi.getColaboradores()); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = colaboradores.filter(c =>
    !search ||
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.cargo.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <Header
        title="Colaboradores"
        rightAction={
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('DepartamentosList')}>
              <Text style={styles.addBtnText}>Depart.</Text>
            </TouchableOpacity>
            {canCreate && (
              <TouchableOpacity style={[styles.addBtn, styles.addBtnPrimary]} onPress={() => navigation.navigate('CreateColaborador')}>
                <Text style={styles.addBtnText}>+ Novo</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      <OfflineBanner />

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Pesquisar colaborador..."
          placeholderTextColor={Colors.gray400}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />}
        ListEmptyComponent={<EmptyState title="Nenhum colaborador encontrado" />}
        renderItem={({item}) => (
          <Card onPress={() => navigation.navigate('ColaboradorDetail', {id: item.id})} style={styles.card}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.nome.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.nome}>{item.nome}</Text>
                <Text style={styles.cargo}>{item.cargo}</Text>
                <Text style={styles.email}>{item.email}</Text>
              </View>
              <View style={styles.right}>
                <View style={[styles.perfilBadge, !item.ativo && styles.perfilBadgeInativo]}>
                  <Text style={styles.perfilText}>{PERFIL_LABELS[item.perfil] ?? item.perfil}</Text>
                </View>
                {!item.ativo && <Text style={styles.inativo}>Inativo</Text>}
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
  headerBtns: {flexDirection: 'row', gap: Spacing.sm},
  addBtn: {backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20},
  addBtnPrimary: {backgroundColor: Colors.primaryLight},
  addBtnText: {color: Colors.white, fontSize: FontSize.xs, fontWeight: FontWeight.semibold as any},
  searchWrap: {padding: Spacing.base, paddingBottom: Spacing.sm},
  search: {backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, fontSize: FontSize.base, color: Colors.gray900},
  list: {padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl']},
  card: {},
  row: {flexDirection: 'row', alignItems: 'center', gap: Spacing.md},
  avatar: {width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center'},
  avatarText: {fontSize: FontSize.lg, fontWeight: FontWeight.bold as any, color: Colors.white},
  info: {flex: 1},
  nome: {fontSize: FontSize.base, fontWeight: FontWeight.semibold as any, color: Colors.gray900},
  cargo: {fontSize: FontSize.sm, color: Colors.gray600},
  email: {fontSize: FontSize.xs, color: Colors.gray400},
  right: {alignItems: 'flex-end', gap: 4},
  perfilBadge: {backgroundColor: Colors.primaryUltraLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: BorderRadius.full},
  perfilBadgeInativo: {backgroundColor: Colors.gray100},
  perfilText: {fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold as any},
  inativo: {fontSize: FontSize.xs, color: Colors.danger},
});
