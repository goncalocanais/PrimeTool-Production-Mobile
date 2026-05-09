import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal} from 'react-native';
import {useRouter} from 'expo-router';
import {Search, ChevronDown, User, Phone, Mail, Plus, X} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;

type StatusType = 'Ativo' | 'Inativo';

interface Fornecedor {
  id: number;
  nome: string;
  nif: string;
  categoria: string;
  contacto: string;
  telefone: string;
  email: string;
  status: StatusType;
}

const FORNECEDORES_MOCK: Fornecedor[] = [
  {id: 1, nome: 'AçoMais Distribuição Lda',   nif: '501234567', categoria: 'Matérias-primas',        contacto: 'Carlos Rodrigues',  telefone: '253 123 456', email: 'carlos@acomais.pt',        status: 'Ativo'},
  {id: 2, nome: 'ElectroSupply SA',            nif: '502345678', categoria: 'Componentes Elétricos',  contacto: 'Sandra Pereira',    telefone: '222 345 678', email: 'sandra@electrosupply.pt',  status: 'Ativo'},
  {id: 3, nome: 'MetalPerfis Norte Lda',       nif: '503456789', categoria: 'Perfis Metálicos',       contacto: 'António Sousa',     telefone: '251 456 789', email: 'antonio@metalperfis.pt',   status: 'Ativo'},
  {id: 4, nome: 'Parafusaria Central',         nif: '504567890', categoria: 'Fixações',               contacto: 'Paulo Martins',     telefone: '219 567 890', email: 'paulo@parafusaria.pt',     status: 'Inativo'},
  {id: 5, nome: 'Tintas & Revestimentos SA',   nif: '505678901', categoria: 'Tintas e Revestimentos', contacto: 'Filipa Costa',      telefone: '244 678 901', email: 'filipa@tintasrevestimentos.pt', status: 'Ativo'},
  {id: 6, nome: 'IsoTec Materiais Lda',        nif: '506789012', categoria: 'Isolamentos',            contacto: 'Rui Almeida',       telefone: '239 789 012', email: 'rui@isotec.pt',            status: 'Ativo'},
  {id: 7, nome: 'FerroMax Indústria SA',       nif: '507890123', categoria: 'Matérias-primas',        contacto: 'Maria João Silva',  telefone: '262 890 123', email: 'mj@ferromax.pt',           status: 'Inativo'},
];

const FILTER_OPTIONS = ['Todos', 'Ativo', 'Inativo'];

const statusStyle = (status: StatusType) =>
  status === 'Ativo'
    ? {bg: Colors.success, text: '#fff'}
    : {bg: ORANGE,         text: '#fff'};

export const FornecedoresScreen: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(FORNECEDORES_MOCK);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('Todos');
  const [filterOpen, setFilterOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [novo, setNovo] = useState({nome: '', nif: '', categoria: '', contacto: '', telefone: '', email: ''});

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const filtered = fornecedores.filter(f => {
    const matchFilter = filter === 'Todos' || f.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || f.nome.toLowerCase().includes(q) || f.nif.includes(q) || f.categoria.toLowerCase().includes(q) || f.contacto.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const handleAddFornecedor = () => {
    if (!novo.nome.trim()) return;
    setFornecedores(prev => [...prev, {
      id: Date.now(), nome: novo.nome, nif: novo.nif,
      categoria: novo.categoria, contacto: novo.contacto,
      telefone: novo.telefone, email: novo.email, status: 'Ativo',
    }]);
    setNovo({nome: '', nif: '', categoria: '', contacto: '', telefone: '', email: ''});
    setShowNovoModal(false);
  };

  return (
    <View style={styles.container}>
      <AppHeader
        section="FORNECEDORES"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      {/* Search + Filter + Novo */}
      <View style={styles.toolBar}>
        <View style={styles.searchBox}>
          <Search size={14} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar..."
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter */}
        <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterOpen(true)} activeOpacity={0.85}>
          <Text style={styles.filterBtnText}>{filter}</Text>
          <ChevronDown size={12} color={NAVY} />
        </TouchableOpacity>

        {/* Novo */}
        <TouchableOpacity style={styles.novoBtn} onPress={() => setShowNovoModal(true)} activeOpacity={0.85}>
          <Plus size={16} color="#fff" strokeWidth={3} />
        </TouchableOpacity>
      </View>

      {/* Count */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>{filtered.length} FORNECEDORES</Text>
      </View>

      {/* Filter modal */}
      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setFilterOpen(false)}>
          <View style={styles.filterMenu}>
            {FILTER_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.filterMenuItem, opt === filter && styles.filterMenuItemActive]}
                onPress={() => {setFilter(opt); setFilterOpen(false);}}>
                <Text style={[styles.filterMenuText, opt === filter && styles.filterMenuTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* List */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Nenhum fornecedor encontrado.</Text>
          </View>
        )}
        {filtered.map(f => {
          const st = statusStyle(f.status);
          const expanded = expandedId === f.id;
          return (
            <View key={f.id} style={styles.card}>
              <TouchableOpacity style={styles.cardHeader} onPress={() => setExpandedId(expanded ? null : f.id)} activeOpacity={0.85}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardNome}>{f.nome}</Text>
                  <Text style={styles.cardCategoria}>{f.categoria}</Text>
                </View>
                <View style={styles.cardHeaderRight}>
                  <View style={[styles.badge, {backgroundColor: st.bg}]}>
                    <Text style={[styles.badgeText, {color: st.text}]}>{f.status}</Text>
                  </View>
                  <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
                </View>
              </TouchableOpacity>

              {expanded && (
                <View style={styles.cardBody}>
                  <View style={styles.cardRow}>
                    <View style={styles.cardField}>
                      <Text style={styles.fieldLabel}>NIF</Text>
                      <Text style={styles.fieldValue}>{f.nif}</Text>
                    </View>
                    <View style={styles.cardField}>
                      <Text style={styles.fieldLabel}>CONTACTO</Text>
                      <Text style={styles.fieldValue}>{f.contacto}</Text>
                    </View>
                  </View>
                  <View style={styles.cardRow}>
                    <View style={[styles.cardField, styles.contactRow]}>
                      <Phone size={12} color={Colors.primaryLight} />
                      <Text style={styles.contactText}>{f.telefone}</Text>
                    </View>
                    <View style={[styles.cardField, styles.contactRow]}>
                      <Mail size={12} color={Colors.primaryLight} />
                      <Text style={styles.contactText} numberOfLines={1}>{f.email}</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <BottomNavBar />

      {/* Modal Novo Fornecedor */}
      <Modal visible={showNovoModal} transparent animationType="slide" onRequestClose={() => setShowNovoModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowNovoModal(false)}>
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Fornecedor</Text>
              <TouchableOpacity onPress={() => setShowNovoModal(false)}>
                <X size={20} color={Colors.gray500} />
              </TouchableOpacity>
            </View>
            {[
              {label: 'NOME DA EMPRESA', key: 'nome', placeholder: 'Ex: AçoMais Lda'},
              {label: 'NIF',             key: 'nif',  placeholder: '501234567'},
              {label: 'CATEGORIA',       key: 'categoria', placeholder: 'Ex: Matérias-primas'},
              {label: 'CONTACTO',        key: 'contacto',  placeholder: 'Nome do responsável'},
              {label: 'TELEFONE',        key: 'telefone',  placeholder: '253 000 111'},
              {label: 'EMAIL',           key: 'email',     placeholder: 'email@empresa.pt'},
            ].map(field => (
              <View key={field.key} style={styles.modalField}>
                <Text style={styles.modalLabel}>{field.label}</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.gray400}
                  value={novo[field.key as keyof typeof novo]}
                  onChangeText={v => setNovo(p => ({...p, [field.key]: v}))}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddFornecedor} activeOpacity={0.85}>
              <Text style={styles.modalSaveBtnText}>ADICIONAR FORNECEDOR</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},

  toolBar: {flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm, alignItems: 'center'},
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 2, borderColor: NAVY, borderRadius: BorderRadius.full,
    backgroundColor: '#fff', paddingHorizontal: Spacing.md,
  },
  searchInput: {flex: 1, paddingVertical: Spacing.sm, fontSize: 11, color: Colors.gray700, fontFamily: 'Exo2_400Regular'},
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: NAVY, borderRadius: BorderRadius.full,
    backgroundColor: '#fff', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  filterBtnText: {fontSize: 11, fontFamily: 'Exo2_700Bold', color: NAVY},
  novoBtn: {backgroundColor: Colors.success, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},

  countRow: {paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm},
  countText: {fontSize: 11, fontFamily: 'Exo2_700Bold', color: Colors.gray600, letterSpacing: 1},

  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl},
  filterMenu: {backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', minWidth: 160, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8},
  filterMenuItem: {padding: Spacing.md},
  filterMenuItemActive: {backgroundColor: '#f0f4ff'},
  filterMenuText: {fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular', color: Colors.gray700},
  filterMenuTextActive: {color: NAVY, fontFamily: 'Exo2_700Bold'},

  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: Spacing.base, paddingBottom: Spacing['3xl'], gap: Spacing.sm},
  emptyState: {paddingTop: 40, alignItems: 'center'},
  emptyText: {color: Colors.gray400, fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular'},

  card: {backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, overflow: 'hidden'},
  cardHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md},
  cardHeaderLeft: {flex: 1, minWidth: 0},
  cardNome: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, color: Colors.gray900},
  cardCategoria: {fontSize: 12, color: Colors.gray500, fontFamily: 'Exo2_400Regular', marginTop: 2},
  cardHeaderRight: {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm},
  badge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full},
  badgeText: {fontSize: 11, fontFamily: 'Exo2_700Bold'},
  chevron: {fontSize: 12, color: Colors.gray400},

  cardBody: {borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.md, backgroundColor: Colors.gray50, gap: Spacing.sm},
  cardRow: {flexDirection: 'row', gap: Spacing.md},
  cardField: {flex: 1},
  fieldLabel: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 0.5, marginBottom: 2},
  fieldValue: {fontSize: FontSize.sm, color: Colors.gray700, fontFamily: 'Exo2_400Regular'},
  contactRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  contactText: {fontSize: 12, color: Colors.primaryLight, fontFamily: 'Exo2_400Regular', flex: 1},

  modalBox: {backgroundColor: '#fff', borderRadius: 16, padding: Spacing.lg, width: '100%', maxHeight: '90%', shadowColor: '#000', shadowOffset: {width: 0, height: 16}, shadowOpacity: 0.2, shadowRadius: 48, elevation: 20},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base},
  modalTitle: {fontFamily: 'Exo2_700Bold', fontSize: 14, color: NAVY},
  modalField: {marginBottom: Spacing.sm},
  modalLabel: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 1, marginBottom: 4},
  modalInput: {borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, padding: Spacing.sm + 2, fontSize: FontSize.sm, color: Colors.gray900, fontFamily: 'Exo2_400Regular'},
  modalSaveBtn: {backgroundColor: ORANGE, borderRadius: BorderRadius.full, paddingVertical: 12, alignItems: 'center', marginTop: Spacing.sm},
  modalSaveBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1},
});
