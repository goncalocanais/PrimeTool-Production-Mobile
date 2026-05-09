import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch,
} from 'react-native';
import {useRouter} from 'expo-router';
import {Shield, Settings, Database, RefreshCw, Bell} from 'lucide-react-native';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius, Shadow} from '../../theme';

const NAVY   = Colors.primary;   // #0d1b4b
const ORANGE = Colors.warning;   // #ff7700
const BLUE   = Colors.primaryLight; // #0094ff

/* ── Stat Card ── */
function StatCard({
  icon,
  iconBg,
  valueColor,
  value,
  label,
}: {
  icon: React.ReactNode;
  iconBg: string;
  valueColor: string;
  value: string;
  label: string;
}) {
  return (
    <View style={statStyles.card}>
      <View style={[statStyles.iconBox, {backgroundColor: iconBg}]}>{icon}</View>
      <View style={{flex: 1, minWidth: 0}}>
        <Text style={[statStyles.value, {color: valueColor}]}>{value}</Text>
        <Text style={statStyles.label} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    width: '48%',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  value: {fontFamily: 'Exo2_700Bold', fontSize: 16, lineHeight: 20},
  label: {fontSize: 10, color: Colors.gray600, marginTop: 2, fontFamily: 'Exo2_400Regular'},
});

/* ── Field ── */
function Field({label, value, onChange}: {label: string; value: string; onChange: (v: string) => void}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={fieldStyles.input}
        placeholderTextColor={Colors.gray400}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: {gap: 4},
  label: {fontSize: 10, fontFamily: 'Exo2_700Bold', letterSpacing: 1.5, color: Colors.gray400},
  input: {
    padding: Spacing.sm + 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    fontSize: FontSize.sm,
    color: Colors.gray900,
    fontFamily: 'Exo2_400Regular',
    backgroundColor: '#fff',
  },
});

/* ── Panel (card with title) ── */
function Panel({title, icon, children}: {title: string; icon: React.ReactNode; children: React.ReactNode}) {
  return (
    <View style={panelStyles.card}>
      <View style={panelStyles.header}>
        {icon}
        <Text style={panelStyles.title}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const panelStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  header: {flexDirection: 'row', alignItems: 'center', gap: 6},
  title: {fontFamily: 'Exo2_700Bold', fontSize: 11, letterSpacing: 1, color: BLUE},
});

/* ── Save button ── */
function SaveBtn({onPress}: {onPress: () => void}) {
  return (
    <TouchableOpacity style={saveStyles.btn} onPress={onPress} activeOpacity={0.85}>
      <Text style={saveStyles.text}>GUARDAR ALTERAÇÕES</Text>
    </TouchableOpacity>
  );
}

const saveStyles = StyleSheet.create({
  btn: {
    backgroundColor: ORANGE,
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 2,
  },
  text: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 10, letterSpacing: 1.5},
});

/* ── Toggle row ── */
function NotifRow({label, value, onChange}: {label: string; value: boolean; onChange: () => void}) {
  return (
    <View style={notifStyles.row}>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{false: Colors.border, true: Colors.primaryLight}}
        thumbColor="#fff"
      />
      <Text style={notifStyles.label}>{label}</Text>
    </View>
  );
}

const notifStyles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1},
  label: {fontSize: 11, color: Colors.gray800, fontFamily: 'Exo2_400Regular', flex: 1},
});

/* ── Main Screen ── */
export const AdminScreen: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);
  const getDisplayName = () => {
    if (!user) return 'Admin';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const [empresa, setEmpresa] = useState({
    nome: 'PrimeTool Industries Lda',
    nif: '509876543',
    email: 'geral@primetool.pt',
    telefone: '253 000 111',
  });

  const [config, setConfig] = useState({
    stockMinimo: '20',
    avisoPrazo: '7',
    obraInicial: '1000',
  });

  const [notif, setNotif] = useState({
    stockBaixo: true,
    novasOrdens: true,
    qualidade: true,
    prazosObra: true,
    guiasTransporte: true,
    relatorio: false,
  });

  const toggleNotif = (key: keyof typeof notif) =>
    setNotif(prev => ({...prev, [key]: !prev[key]}));

  return (
    <View style={styles.container}>
      <AppHeader
        section="ADMIN"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <StatCard iconBg="#dbeafe" icon={<Shield size={16} color="#3b82f6" />} valueColor="#3b82f6" value="6" label="Utilizadores" />
          <StatCard iconBg="#dcfce7" icon={<Settings size={16} color={Colors.success} />} valueColor={Colors.success} value="9" label="Módulos" />
          <StatCard iconBg="#ede9fe" icon={<Database size={16} color="#8b5cf6" />} valueColor="#8b5cf6" value="Auto" label="Backups" />
          <StatCard iconBg="#fff3e0" icon={<RefreshCw size={16} color={ORANGE} />} valueColor={ORANGE} value="1.0" label="Versão" />
        </View>

        {/* Dados da empresa */}
        <Panel title="DADOS DA EMPRESA" icon={<Database size={14} color={BLUE} />}>
          <Field label="NOME DA EMPRESA" value={empresa.nome} onChange={v => setEmpresa(p => ({...p, nome: v}))} />
          <Field label="NIF"             value={empresa.nif}   onChange={v => setEmpresa(p => ({...p, nif: v}))} />
          <Field label="EMAIL"           value={empresa.email} onChange={v => setEmpresa(p => ({...p, email: v}))} />
          <Field label="TELEFONE"        value={empresa.telefone} onChange={v => setEmpresa(p => ({...p, telefone: v}))} />
          <SaveBtn onPress={() => {}} />
        </Panel>

        {/* Configurações */}
        <Panel title="CONFIGURAÇÕES" icon={<Settings size={14} color={BLUE} />}>
          <Field label="STOCK MÍNIMO (%)"   value={config.stockMinimo} onChange={v => setConfig(p => ({...p, stockMinimo: v}))} />
          <Field label="AVISO PRAZO (DIAS)" value={config.avisoPrazo}  onChange={v => setConfig(p => ({...p, avisoPrazo: v}))} />
          <Field label="Nº OBRA INICIAL"    value={config.obraInicial} onChange={v => setConfig(p => ({...p, obraInicial: v}))} />
          <SaveBtn onPress={() => {}} />
        </Panel>

        {/* Notificações */}
        <Panel title="NOTIFICAÇÕES" icon={<Bell size={14} color={BLUE} />}>
          <NotifRow label="Alertas de Stock Baixo"         value={notif.stockBaixo}      onChange={() => toggleNotif('stockBaixo')} />
          <NotifRow label="Prazos de Obra a Vencer"        value={notif.prazosObra}      onChange={() => toggleNotif('prazosObra')} />
          <NotifRow label="Novas Ordens de Produção"       value={notif.novasOrdens}     onChange={() => toggleNotif('novasOrdens')} />
          <NotifRow label="Guias de Transporte Pendentes"  value={notif.guiasTransporte} onChange={() => toggleNotif('guiasTransporte')} />
          <NotifRow label="Qualidade Reprovada"            value={notif.qualidade}       onChange={() => toggleNotif('qualidade')} />
          <NotifRow label="Relatório Diário por Email"     value={notif.relatorio}       onChange={() => toggleNotif('relatorio')} />
        </Panel>

      </ScrollView>

      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  scroll: {flex: 1},
  scrollContent: {padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl']},

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },

});
