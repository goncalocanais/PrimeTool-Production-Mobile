import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal,
} from 'react-native';
import {useRouter} from 'expo-router';
import {Search, ChevronDown, Plus, X, Phone, Mail, Building2} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;
const GREEN  = Colors.success;

type PerfilType = 'direcao' | 'rh' | 'planeamento' | 'armazem' | 'producao' | 'qualidade' | 'expedicao' | 'montagem';
type StatusType = 'Ativo' | 'Inativo';

const PERFIL_LABELS: Record<PerfilType, string> = {
  direcao:    'Direção',
  rh:         'Recursos Humanos',
  planeamento:'Planeamento',
  armazem:    'Armazém',
  producao:   'Produção',
  qualidade:  'Qualidade',
  expedicao:  'Expedição',
  montagem:   'Montagem',
};

const PERFIL_COLORS: Record<PerfilType, string> = {
  direcao:    '#0d1b4b',
  rh:         '#8b5cf6',
  planeamento:'#0094ff',
  armazem:    '#eab308',
  producao:   '#3b82f6',
  qualidade:  '#00b85c',
  expedicao:  '#ff7700',
  montagem:   '#e53935',
};

interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
  perfil: PerfilType;
  telefone: string;
  email: string;
  dataAdmissao: string;
  status: StatusType;
}

const MOCK: Colaborador[] = [
  {id: '1',  nome: 'Miguel Ferreira',     cargo: 'Diretor de Produção',      departamento: 'Direção',        perfil: 'direcao',    telefone: '912 345 678', email: 'miguel.ferreira@primetool.pt',     dataAdmissao: '2018-03-01', status: 'Ativo'},
  {id: '2',  nome: 'Ana Rodrigues',       cargo: 'Técnica de RH',            departamento: 'Recursos Humanos',perfil: 'rh',         telefone: '913 456 789', email: 'ana.rodrigues@primetool.pt',       dataAdmissao: '2019-06-15', status: 'Ativo'},
  {id: '3',  nome: 'João Silva',          cargo: 'Responsável Planeamento',  departamento: 'Planeamento',    perfil: 'planeamento', telefone: '914 567 890', email: 'joao.silva@primetool.pt',          dataAdmissao: '2020-01-10', status: 'Ativo'},
  {id: '4',  nome: 'Carlos Almeida',      cargo: 'Operador de Produção',     departamento: 'Produção',       perfil: 'producao',   telefone: '915 678 901', email: 'carlos.almeida@primetool.pt',      dataAdmissao: '2021-04-20', status: 'Ativo'},
  {id: '5',  nome: 'Maria Costa',         cargo: 'Operadora de Produção',    departamento: 'Produção',       perfil: 'producao',   telefone: '916 789 012', email: 'maria.costa@primetool.pt',         dataAdmissao: '2021-09-05', status: 'Ativo'},
  {id: '6',  nome: 'Rui Santos',          cargo: 'Técnico de Qualidade',     departamento: 'Qualidade',      perfil: 'qualidade',  telefone: '917 890 123', email: 'rui.santos@primetool.pt',          dataAdmissao: '2020-07-12', status: 'Ativo'},
  {id: '7',  nome: 'Filipa Oliveira',     cargo: 'Responsável Expedição',    departamento: 'Expedição',      perfil: 'expedicao',  telefone: '918 901 234', email: 'filipa.oliveira@primetool.pt',     dataAdmissao: '2022-02-28', status: 'Ativo'},
  {id: '8',  nome: 'António Pereira',     cargo: 'Técnico de Montagem',      departamento: 'Montagem',       perfil: 'montagem',   telefone: '919 012 345', email: 'antonio.pereira@primetool.pt',     dataAdmissao: '2022-08-01', status: 'Ativo'},
  {id: '9',  nome: 'Sandra Martins',      cargo: 'Operadora de Montagem',    departamento: 'Montagem',       perfil: 'montagem',   telefone: '910 123 456', email: 'sandra.martins@primetool.pt',      dataAdmissao: '2023-01-16', status: 'Ativo'},
  {id: '10', nome: 'Paulo Gomes',         cargo: 'Responsável Armazém',      departamento: 'Armazém',        perfil: 'armazem',    telefone: '911 234 567', email: 'paulo.gomes@primetool.pt',         dataAdmissao: '2019-11-03', status: 'Ativo'},
  {id: '11', nome: 'Luísa Fernandes',     cargo: 'Operadora de Produção',    departamento: 'Produção',       perfil: 'producao',   telefone: '912 345 001', email: 'luisa.fernandes@primetool.pt',     dataAdmissao: '2020-05-18', status: 'Inativo'},
  {id: '12', nome: 'Tiago Rocha',         cargo: 'Técnico de Planeamento',   departamento: 'Planeamento',    perfil: 'planeamento', telefone: '913 456 002', email: 'tiago.rocha@primetool.pt',        dataAdmissao: '2023-06-01', status: 'Ativo'},
];

const DEPARTAMENTOS = ['Todos', 'Direção', 'Recursos Humanos', 'Planeamento', 'Produção', 'Qualidade', 'Expedição', 'Montagem', 'Armazém'];
const STATUS_OPTS   = ['Todos', 'Ativo', 'Inativo'];

const EMPTY_NOVO = {nome: '', cargo: '', departamento: '', perfil: 'producao' as PerfilType, telefone: '', email: ''};

export const ColaboradoresScreen: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);
  const canEdit = ['rh', 'direcao'].includes(user?.perfil ?? '');

  const [colaboradores, setColaboradores] = useState<Colaborador[]>(MOCK);
  const [search, setSearch]             = useState('');
  const [filterDepto, setFilterDepto]   = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [deptoOpen, setDeptoOpen]       = useState(false);
  const [statusOpen, setStatusOpen]     = useState(false);
  const [expandedId, setExpandedId]     = useState<string | null>(null);
  const [showNovo, setShowNovo]         = useState(false);
  const [novo, setNovo]                 = useState(EMPTY_NOVO);

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const filtered = colaboradores.filter(c => {
    const matchDepto  = filterDepto  === 'Todos' || c.departamento === filterDepto;
    const matchStatus = filterStatus === 'Todos' || c.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || c.nome.toLowerCase().includes(q) || c.cargo.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    return matchDepto && matchStatus && matchSearch;
  });

  const toggleStatus = (id: string) => {
    setColaboradores(prev => prev.map(c =>
      c.id === id ? {...c, status: c.status === 'Ativo' ? 'Inativo' : 'Ativo'} : c,
    ));
  };

  const handleAdd = () => {
    if (!novo.nome.trim()) return;
    setColaboradores(prev => [...prev, {
      id: Date.now().toString(),
      nome: novo.nome, cargo: novo.cargo,
      departamento: novo.departamento || PERFIL_LABELS[novo.perfil],
      perfil: novo.perfil, telefone: novo.telefone, email: novo.email,
      dataAdmissao: new Date().toISOString().split('T')[0],
      status: 'Ativo',
    }]);
    setNovo(EMPTY_NOVO);
    setShowNovo(false);
  };

  const toDate = (s: string) => s.split('-').reverse().join('/');

  const getInitials = (nome: string) => {
    const parts = nome.split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : nome.slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <AppHeader
        section="RECURSOS HUMANOS"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Search size={14} color={Colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar colaborador..."
            placeholderTextColor={Colors.gray400}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {canEdit && (
          <TouchableOpacity style={styles.novoBtn} onPress={() => setShowNovo(true)} activeOpacity={0.85}>
            <Plus size={16} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros */}
      <View style={styles.filtersRow}>
        <TouchableOpacity style={styles.filterChip} onPress={() => setDeptoOpen(true)} activeOpacity={0.85}>
          <Building2 size={11} color={NAVY} />
          <Text style={styles.filterChipText} numberOfLines={1}>
            {filterDepto === 'Todos' ? 'Departamento' : filterDepto}
          </Text>
          <ChevronDown size={11} color={NAVY} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, filterStatus !== 'Todos' && styles.filterChipActive]} onPress={() => setStatusOpen(true)} activeOpacity={0.85}>
          <Text style={[styles.filterChipText, filterStatus !== 'Todos' && styles.filterChipTextActive]}>
            {filterStatus === 'Todos' ? 'Estado' : filterStatus}
          </Text>
          <ChevronDown size={11} color={filterStatus !== 'Todos' ? '#fff' : NAVY} />
        </TouchableOpacity>
        <Text style={styles.countText}>{filtered.length} colaboradores</Text>
      </View>

      {/* Departamento modal */}
      <Modal visible={deptoOpen} transparent animationType="fade" onRequestClose={() => setDeptoOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setDeptoOpen(false)}>
          <View style={styles.filterMenu}>
            {DEPARTAMENTOS.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.filterMenuItem, d === filterDepto && styles.filterMenuItemActive]}
                onPress={() => {setFilterDepto(d); setDeptoOpen(false);}}>
                <Text style={[styles.filterMenuText, d === filterDepto && styles.filterMenuTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Status modal */}
      <Modal visible={statusOpen} transparent animationType="fade" onRequestClose={() => setStatusOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setStatusOpen(false)}>
          <View style={styles.filterMenu}>
            {STATUS_OPTS.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.filterMenuItem, s === filterStatus && styles.filterMenuItemActive]}
                onPress={() => {setFilterStatus(s); setStatusOpen(false);}}>
                <Text style={[styles.filterMenuText, s === filterStatus && styles.filterMenuTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Lista */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 && (
          <View style={styles.emptyState}><Text style={styles.emptyText}>Nenhum colaborador encontrado.</Text></View>
        )}

        {filtered.map(c => {
          const cor = PERFIL_COLORS[c.perfil];
          const expanded = expandedId === c.id;
          return (
            <View key={c.id} style={[styles.card, {borderLeftColor: cor}]}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpandedId(expanded ? null : c.id)}
                activeOpacity={0.85}>
                {/* Avatar */}
                <View style={[styles.avatar, {backgroundColor: cor}]}>
                  <Text style={styles.avatarText}>{getInitials(c.nome)}</Text>
                </View>
                {/* Info */}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardNome}>{c.nome}</Text>
                  <Text style={styles.cardCargo}>{c.cargo}</Text>
                  <View style={[styles.perfilBadge, {backgroundColor: cor + '18'}]}>
                    <Text style={[styles.perfilText, {color: cor}]}>{PERFIL_LABELS[c.perfil]}</Text>
                  </View>
                </View>
                {/* Status + seta */}
                <View style={styles.cardRight}>
                  <View style={[styles.statusDot, {backgroundColor: c.status === 'Ativo' ? GREEN : Colors.gray400}]} />
                  <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
                </View>
              </TouchableOpacity>

              {expanded && (
                <View style={styles.cardBody}>
                  <View style={styles.bodyRow}>
                    <View style={styles.bodyField}>
                      <Text style={styles.bodyLabel}>DEPARTAMENTO</Text>
                      <Text style={styles.bodyValue}>{c.departamento}</Text>
                    </View>
                    <View style={styles.bodyField}>
                      <Text style={styles.bodyLabel}>ADMISSÃO</Text>
                      <Text style={styles.bodyValue}>{toDate(c.dataAdmissao)}</Text>
                    </View>
                  </View>
                  <View style={styles.bodyRow}>
                    <View style={[styles.bodyField, styles.contactRow]}>
                      <Phone size={12} color={Colors.primaryLight} />
                      <Text style={styles.contactText}>{c.telefone}</Text>
                    </View>
                    <View style={[styles.bodyField, styles.contactRow]}>
                      <Mail size={12} color={Colors.primaryLight} />
                      <Text style={styles.contactText} numberOfLines={1}>{c.email}</Text>
                    </View>
                  </View>
                  {canEdit && (
                    <TouchableOpacity
                      style={[styles.toggleBtn, {borderColor: c.status === 'Ativo' ? Colors.danger : GREEN}]}
                      onPress={() => toggleStatus(c.id)}
                      activeOpacity={0.85}>
                      <Text style={[styles.toggleBtnText, {color: c.status === 'Ativo' ? Colors.danger : GREEN}]}>
                        {c.status === 'Ativo' ? 'Desativar Colaborador' : 'Reativar Colaborador'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <BottomNavBar />

      {/* Modal novo colaborador */}
      <Modal visible={showNovo} transparent animationType="slide" onRequestClose={() => setShowNovo(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowNovo(false)}>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled">
            <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Novo Colaborador</Text>
                <TouchableOpacity onPress={() => setShowNovo(false)}>
                  <X size={20} color={Colors.gray500} />
                </TouchableOpacity>
              </View>

              {([
                {label: 'NOME COMPLETO *', key: 'nome',      placeholder: 'Ex: João Silva'},
                {label: 'CARGO',           key: 'cargo',     placeholder: 'Ex: Operador de Produção'},
                {label: 'TELEFONE',        key: 'telefone',  placeholder: '912 345 678'},
                {label: 'EMAIL',           key: 'email',     placeholder: 'email@primetool.pt'},
              ] as {label: string; key: string; placeholder: string}[]).map(f => (
                <View key={f.key} style={styles.modalField}>
                  <Text style={styles.modalLabel}>{f.label}</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={f.placeholder}
                    placeholderTextColor={Colors.gray400}
                    value={(novo as any)[f.key]}
                    onChangeText={v => setNovo(p => ({...p, [f.key]: v}))}
                  />
                </View>
              ))}

              {/* Perfil */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>PERFIL / MÓDULO</Text>
                <View style={styles.perfilGrid}>
                  {(Object.keys(PERFIL_LABELS) as PerfilType[]).map(p => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.perfilOption, novo.perfil === p && {backgroundColor: PERFIL_COLORS[p], borderColor: PERFIL_COLORS[p]}]}
                      onPress={() => setNovo(prev => ({...prev, perfil: p}))}
                      activeOpacity={0.85}>
                      <Text style={[styles.perfilOptionText, novo.perfil === p && {color: '#fff'}]}>
                        {PERFIL_LABELS[p]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAdd} activeOpacity={0.85}>
                <Text style={styles.modalSaveBtnText}>ADICIONAR COLABORADOR</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},

  toolbar: {flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm, alignItems: 'center'},
  searchBox: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, borderWidth: 2, borderColor: NAVY, borderRadius: BorderRadius.full, backgroundColor: '#fff', paddingHorizontal: Spacing.md},
  searchInput: {flex: 1, paddingVertical: Spacing.sm, fontSize: 11, color: Colors.gray700, fontFamily: 'Exo2_400Regular'},
  novoBtn: {backgroundColor: GREEN, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},

  filtersRow: {flexDirection: 'row', paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm, gap: Spacing.sm, alignItems: 'center'},
  filterChip: {flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: NAVY, borderRadius: BorderRadius.full, backgroundColor: '#fff', paddingHorizontal: Spacing.md, paddingVertical: 5},
  filterChipActive: {backgroundColor: NAVY, borderColor: NAVY},
  filterChipText: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: NAVY},
  filterChipTextActive: {color: '#fff'},
  countText: {flex: 1, textAlign: 'right', fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray500, letterSpacing: 0.5},

  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl},
  filterMenu: {backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', minWidth: 200, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8},
  filterMenuItem: {padding: Spacing.md},
  filterMenuItemActive: {backgroundColor: '#f0f4ff'},
  filterMenuText: {fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular', color: Colors.gray700},
  filterMenuTextActive: {color: NAVY, fontFamily: 'Exo2_700Bold'},

  scroll: {flex: 1},
  scrollContent: {paddingHorizontal: Spacing.base, paddingBottom: Spacing['3xl'], gap: Spacing.sm},
  emptyState: {paddingTop: 40, alignItems: 'center'},
  emptyText: {color: Colors.gray400, fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular'},

  card: {backgroundColor: '#fff', borderRadius: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2, overflow: 'hidden'},
  cardHeader: {flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md},
  avatar: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0},
  avatarText: {fontFamily: 'Exo2_700Bold', fontSize: 14, color: '#fff'},
  cardInfo: {flex: 1, gap: 2},
  cardNome: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, color: Colors.gray900},
  cardCargo: {fontSize: 11, color: Colors.gray500, fontFamily: 'Exo2_400Regular'},
  perfilBadge: {alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: BorderRadius.full, marginTop: 2},
  perfilText: {fontSize: 9, fontFamily: 'Exo2_700Bold', letterSpacing: 0.3},
  cardRight: {alignItems: 'center', gap: 6},
  statusDot: {width: 10, height: 10, borderRadius: 5},
  chevron: {fontSize: 11, color: Colors.gray400},

  cardBody: {borderTopWidth: 1, borderTopColor: Colors.gray50, padding: Spacing.md, backgroundColor: Colors.gray50, gap: Spacing.sm},
  bodyRow: {flexDirection: 'row', gap: Spacing.md},
  bodyField: {flex: 1},
  bodyLabel: {fontSize: 9, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 0.5, marginBottom: 2},
  bodyValue: {fontSize: 12, color: Colors.gray700, fontFamily: 'Exo2_600SemiBold'},
  contactRow: {flexDirection: 'row', alignItems: 'center', gap: 4},
  contactText: {fontSize: 11, color: Colors.primaryLight, fontFamily: 'Exo2_400Regular', flex: 1},
  toggleBtn: {borderWidth: 1.5, borderRadius: BorderRadius.full, paddingVertical: 7, alignItems: 'center', marginTop: 4},
  toggleBtnText: {fontSize: 11, fontFamily: 'Exo2_700Bold'},

  modalScroll: {flex: 1, width: '100%'},
  modalScrollContent: {flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl},
  modalBox: {backgroundColor: '#fff', borderRadius: 16, padding: Spacing.lg, width: '100%', shadowColor: '#000', shadowOffset: {width: 0, height: 16}, shadowOpacity: 0.2, shadowRadius: 48, elevation: 20},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.base},
  modalTitle: {fontFamily: 'Exo2_700Bold', fontSize: 14, color: NAVY},
  modalField: {marginBottom: Spacing.sm},
  modalLabel: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 1, marginBottom: 4},
  modalInput: {borderWidth: 1.5, borderColor: Colors.border, borderRadius: 8, padding: Spacing.sm + 2, fontSize: FontSize.sm, color: Colors.gray900, fontFamily: 'Exo2_400Regular'},
  perfilGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm},
  perfilOption: {borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6},
  perfilOptionText: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray500},
  modalSaveBtn: {backgroundColor: ORANGE, borderRadius: BorderRadius.full, paddingVertical: 12, alignItems: 'center', marginTop: Spacing.sm},
  modalSaveBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1},
});
