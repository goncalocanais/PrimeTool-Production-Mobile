import React, {useState} from 'react';
import {View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal} from 'react-native';
import {useRouter} from 'expo-router';
import {Search, ChevronDown} from 'lucide-react-native';
import {useAppSelector, useAppDispatch} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {deleteOrder} from '../../store/slices/ordersSlice';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';
import {OrdemProducao, UserRole} from '../../types';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;

type EstadoOP = 'EM MONTAGEM' | 'EM EXPEDIÇÃO' | 'EM PRODUÇÃO' | 'AGUARDA MATERIAL' | 'CONCLUÍDA' | 'SUSPENSA' | 'PLANEAMENTO' | 'QUALIDADE';

const ESTADO_STYLES: Record<string, {bg: string; color: string}> = {
  planeamento:      {bg: Colors.primaryLight, color: '#fff'},
  em_producao:      {bg: '#3b82f6',           color: '#fff'},
  qualidade:        {bg: '#eab308',           color: '#fff'},
  expedicao:        {bg: '#8b5cf6',           color: '#fff'},
  montagem:         {bg: ORANGE,              color: '#fff'},
  concluida:        {bg: Colors.success,      color: '#fff'},
  cancelada:        {bg: Colors.danger,       color: '#fff'},
  aguarda_material: {bg: '#eab308',           color: '#fff'},
};

const STATUS_LABELS: Record<string, string> = {
  planeamento:      'PLANEAMENTO',
  em_producao:      'EM PRODUÇÃO',
  qualidade:        'QUALIDADE',
  expedicao:        'EM EXPEDIÇÃO',
  montagem:         'EM MONTAGEM',
  concluida:        'CONCLUÍDA',
  cancelada:        'CANCELADA',
  aguarda_material: 'AGUARDA MATERIAL',
};

const STATUS_FILTERS = [
  {label: 'Todos',          value: 'todos'},
  {label: 'Planeamento',    value: 'planeamento'},
  {label: 'Em Produção',    value: 'em_producao'},
  {label: 'Qualidade',      value: 'qualidade'},
  {label: 'Em Expedição',   value: 'expedicao'},
  {label: 'Em Montagem',    value: 'montagem'},
  {label: 'Concluída',      value: 'concluida'},
  {label: 'Aguarda Mat.',   value: 'aguarda_material'},
];

/* ── Order Card ── */
function OrderCard({order, onPress}: {order: OrdemProducao; onPress: () => void}) {
  const st = ESTADO_STYLES[order.status] ?? {bg: Colors.gray400, color: '#fff'};
  const label = STATUS_LABELS[order.status] ?? order.status.toUpperCase();

  return (
    <TouchableOpacity style={[cardStyles.card, {borderLeftColor: st.bg}]} onPress={onPress} activeOpacity={0.85}>
      {/* Top: ref + badge */}
      <View style={cardStyles.topRow}>
        <Text style={cardStyles.ref}>{order.referencia}</Text>
        <View style={[cardStyles.badge, {backgroundColor: st.bg}]}>
          <Text style={cardStyles.badgeText}>{label}</Text>
        </View>
      </View>

      {/* Nome */}
      <Text style={cardStyles.nome}>{order.descricao}</Text>

      {/* Cliente */}
      <Text style={cardStyles.cliente}>{order.cliente}</Text>

      {/* Bottom: entrega + responsável */}
      <View style={cardStyles.bottomRow}>
        <View>
          <Text style={cardStyles.fieldLabel}>ENTREGA PREVISTA</Text>
          <Text style={cardStyles.fieldValue}>
            {new Date(order.dataFimPrevista).toLocaleDateString('pt-PT')}
          </Text>
        </View>
        <View style={{alignItems: 'flex-end'}}>
          <Text style={cardStyles.fieldLabel}>RESPONSÁVEL</Text>
          <Text style={cardStyles.fieldValue}>{order.responsavel ?? '—'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: Spacing.md, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  topRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4},
  ref: {
    color: NAVY, fontFamily: 'Exo2_700Bold', fontSize: 14,
    textDecorationLine: 'underline', textDecorationColor: 'rgba(13,27,75,0.3)',
  },
  badge: {paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.full},
  badgeText: {color: '#fff', fontSize: 10, fontFamily: 'Exo2_700Bold', letterSpacing: 0.3},
  nome: {color: Colors.gray900, fontSize: FontSize.sm, fontFamily: 'Exo2_600SemiBold', marginBottom: 2},
  cliente: {color: Colors.gray600, fontSize: 12, fontFamily: 'Exo2_400Regular', marginBottom: Spacing.sm},
  bottomRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.gray50,
  },
  fieldLabel: {color: Colors.gray400, fontSize: 10, fontFamily: 'Exo2_700Bold', marginBottom: 1},
  fieldValue: {color: Colors.gray700, fontSize: 12, fontFamily: 'Exo2_600SemiBold'},
});

/* ── Main Screen ── */
export const OrdersListScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const {orders} = useAppSelector(s => s.orders);
  const user = useAppSelector(s => s.auth.user);
  const role = (user?.perfil ?? 'producao') as UserRole;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showFilter, setShowFilter] = useState(false);

  const canCreate = ['planeamento', 'direcao'].includes(role);

  const sectionLabel = ['producao', 'montagem'].includes(role) ? 'PRODUÇÃO' : 'PLANEAMENTO';

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const filteredOrders = orders.filter(o => {
    const matchStatus = statusFilter === 'todos' || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || o.referencia.toLowerCase().includes(q) || o.descricao.toLowerCase().includes(q) || o.cliente.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const currentFilterLabel = STATUS_FILTERS.find(f => f.value === statusFilter)?.label ?? 'Estado';

  return (
    <View style={styles.container}>
      <AppHeader
        section={sectionLabel}
        subtitle="CONSULTAR ORDENS"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Text style={styles.breadcrumbLink}>{sectionLabel}</Text>
        </TouchableOpacity>
        <Text style={styles.breadcrumbSep}> › </Text>
        <Text style={styles.breadcrumbCurrent}>CONSULTAR ORDENS DE PRODUÇÃO</Text>
      </View>

      {/* Search + Filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={14} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar referência, nome..."
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter(true)} activeOpacity={0.85}>
          <Text style={styles.filterBtnText}>
            {statusFilter === 'todos' ? 'Estado' : currentFilterLabel.slice(0, 7) + (currentFilterLabel.length > 7 ? '…' : '')}
          </Text>
          <ChevronDown size={13} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter modal */}
      <Modal visible={showFilter} transparent animationType="fade" onRequestClose={() => setShowFilter(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowFilter(false)}>
          <View style={styles.filterMenu}>
            {STATUS_FILTERS.map(f => (
              <TouchableOpacity
                key={f.value}
                style={[styles.filterMenuItem, f.value === statusFilter && styles.filterMenuItemActive]}
                onPress={() => {setStatusFilter(f.value); setShowFilter(false);}}>
                <Text style={[styles.filterMenuText, f.value === statusFilter && styles.filterMenuTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Count + Nova OP */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {filteredOrders.length} {filteredOrders.length === 1 ? 'ordem encontrada' : 'ordens encontradas'}
        </Text>
        {canCreate && (
          <TouchableOpacity style={styles.newOpBtn} onPress={() => router.push('/orders/create')} activeOpacity={0.85}>
            <Text style={styles.newOpBtnText}>+ NOVA OP</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}>
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhuma ordem encontrada.</Text>
          </View>
        ) : (
          filteredOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => router.push(`/orders/${order.id}` as any)}
            />
          ))
        )}
      </ScrollView>

      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},

  breadcrumb: {
    backgroundColor: ORANGE, paddingHorizontal: Spacing.base, paddingVertical: 7,
    flexDirection: 'row', alignItems: 'center',
  },
  breadcrumbLink: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 11, letterSpacing: 1, opacity: 0.85},
  breadcrumbSep:  {color: 'rgba(255,255,255,0.6)', fontSize: 11, marginHorizontal: 4},
  breadcrumbCurrent: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 11, letterSpacing: 1},

  searchRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
  },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  searchInput: {
    flex: 1, paddingVertical: Spacing.sm + 1,
    fontSize: 12, color: Colors.gray700, fontFamily: 'Exo2_400Regular',
  },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: NAVY, borderRadius: 10,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 1,
  },
  filterBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 11},

  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center'},
  filterMenu: {
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', minWidth: 180,
    shadowColor: '#000', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  filterMenuItem: {paddingHorizontal: Spacing.md, paddingVertical: 10},
  filterMenuItemActive: {backgroundColor: '#f0f4ff'},
  filterMenuText: {fontSize: 12, fontFamily: 'Exo2_400Regular', color: Colors.gray700},
  filterMenuTextActive: {color: NAVY, fontFamily: 'Exo2_700Bold'},

  countRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm,
  },
  countText: {color: Colors.gray400, fontSize: 11, fontFamily: 'Exo2_400Regular'},
  newOpBtn: {
    backgroundColor: Colors.success, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  newOpBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm},

  list: {flex: 1},
  listContent: {paddingHorizontal: Spacing.base, paddingBottom: Spacing['3xl'], gap: Spacing.sm},
  emptyState: {paddingTop: 40, alignItems: 'center'},
  emptyText: {color: Colors.gray400, fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular'},
});
