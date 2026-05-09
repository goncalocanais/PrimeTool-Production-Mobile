import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {useRouter} from 'expo-router';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;
const GREEN  = Colors.success;
const BLUE   = Colors.primaryLight;

const BAR_HEIGHT = 90; // altura fixa em px para as barras

/* ── KPI Card ── */
function KpiCard({label, value, sub, color}: {label: string; value: string; sub: string; color: string}) {
  return (
    <View style={[kpiStyles.card, {borderTopColor: color}]}>
      <Text style={kpiStyles.value}>{value}</Text>
      <Text style={kpiStyles.label}>{label}</Text>
      <Text style={kpiStyles.sub}>{sub}</Text>
    </View>
  );
}
const kpiStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: Spacing.md,
    borderTopWidth: 3,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  value: {fontFamily: 'Exo2_700Bold', fontSize: 22, color: Colors.gray900, marginBottom: 2},
  label: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray400, letterSpacing: 0.8},
  sub: {fontSize: 10, fontFamily: 'Exo2_400Regular', color: Colors.gray400, marginTop: 2},
});

/* ── Bar Chart ── */
interface BarData {label: string; value: number; color: string}
function BarChart({data, title, unit = ''}: {data: BarData[]; title: string; unit?: string}) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <View style={chartStyles.card}>
      <Text style={chartStyles.title}>{title}</Text>
      <View style={chartStyles.barsArea}>
        {data.map((d, i) => {
          const fillHeight = Math.max(Math.round((d.value / max) * BAR_HEIGHT), 2);
          return (
            <View key={i} style={chartStyles.barCol}>
              <Text style={chartStyles.barVal}>{d.value}{unit}</Text>
              <View style={chartStyles.barTrack}>
                <View style={[chartStyles.barFill, {height: fillHeight, backgroundColor: d.color}]} />
              </View>
              <Text style={chartStyles.barLabel} numberOfLines={2}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
const chartStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: Spacing.md,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  title: {fontFamily: 'Exo2_700Bold', fontSize: 12, color: NAVY, letterSpacing: 0.5, marginBottom: Spacing.md},
  barsArea: {flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm},
  barCol: {flex: 1, alignItems: 'center'},
  barVal: {fontSize: 10, fontFamily: 'Exo2_700Bold', color: Colors.gray700, marginBottom: 4},
  barTrack: {
    width: '100%', height: BAR_HEIGHT,
    backgroundColor: Colors.gray50, borderRadius: 4,
    overflow: 'hidden', justifyContent: 'flex-end',
  },
  barFill: {width: '100%', borderRadius: 4},
  barLabel: {fontSize: 9, fontFamily: 'Exo2_400Regular', color: Colors.gray400, textAlign: 'center', marginTop: 4},
});

/* ── Pie/Progress Chart ── */
interface PieSlice {label: string; value: number; color: string}
function PieChart({data, title}: {data: PieSlice[]; title: string}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <View style={pieStyles.card}>
      <Text style={pieStyles.title}>{title}</Text>
      {/* Stacked bar */}
      <View style={pieStyles.stack}>
        {data.map((d, i) => {
          const pct = total ? (d.value / total) * 100 : 0;
          return (
            <View
              key={i}
              style={{
                width: `${pct}%` as any,
                height: 16,
                backgroundColor: d.color,
                borderTopLeftRadius: i === 0 ? 8 : 0,
                borderBottomLeftRadius: i === 0 ? 8 : 0,
                borderTopRightRadius: i === data.length - 1 ? 8 : 0,
                borderBottomRightRadius: i === data.length - 1 ? 8 : 0,
              }}
            />
          );
        })}
      </View>
      {/* Legend */}
      <View style={pieStyles.legend}>
        {data.map((d, i) => (
          <View key={i} style={pieStyles.legendRow}>
            <View style={[pieStyles.dot, {backgroundColor: d.color}]} />
            <Text style={pieStyles.legendLabel} numberOfLines={1}>{d.label}</Text>
            <Text style={pieStyles.legendPct}>
              {total ? Math.round((d.value / total) * 100) : 0}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const pieStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: Spacing.md,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  title: {fontFamily: 'Exo2_700Bold', fontSize: 12, color: NAVY, letterSpacing: 0.5, marginBottom: Spacing.md},
  stack: {flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: Colors.gray50},
  legend: {marginTop: Spacing.md, gap: 6},
  legendRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  dot: {width: 10, height: 10, borderRadius: 5, flexShrink: 0},
  legendLabel: {flex: 1, fontSize: 11, fontFamily: 'Exo2_400Regular', color: Colors.gray700},
  legendPct: {fontSize: 11, fontFamily: 'Exo2_700Bold', color: Colors.gray700},
});

/* ── Períodos ── */
const PERIODS = ['Semana', 'Mês', 'Trimestre', 'Ano'];

/* ── Main Screen ── */
export const RelatoriosScreen: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);
  const [period, setPeriod] = useState('Mês');

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const kpis: Record<string, {ops: string; eficiencia: string; entregas: string; atraso: string}> = {
    Semana:    {ops: '12',  eficiencia: '87%', entregas: '94%', atraso: '2'},
    Mês:       {ops: '47',  eficiencia: '91%', entregas: '96%', atraso: '5'},
    Trimestre: {ops: '134', eficiencia: '89%', entregas: '93%', atraso: '14'},
    Ano:       {ops: '512', eficiencia: '90%', entregas: '95%', atraso: '48'},
  };
  const k = kpis[period] ?? kpis['Mês'];

  const prodBar: Record<string, BarData[]> = {
    Semana:    [{label: 'Seg', value: 3, color: BLUE}, {label: 'Ter', value: 5, color: BLUE}, {label: 'Qua', value: 2, color: BLUE}, {label: 'Qui', value: 4, color: BLUE}, {label: 'Sex', value: 6, color: BLUE}],
    Mês:       [{label: 'Sem 1', value: 11, color: BLUE}, {label: 'Sem 2', value: 14, color: BLUE}, {label: 'Sem 3', value: 10, color: BLUE}, {label: 'Sem 4', value: 12, color: BLUE}],
    Trimestre: [{label: 'Fev', value: 40, color: BLUE}, {label: 'Mar', value: 47, color: BLUE}, {label: 'Abr', value: 47, color: BLUE}],
    Ano:       [{label: 'Jan', value: 38, color: BLUE}, {label: 'Fev', value: 41, color: BLUE}, {label: 'Mar', value: 45, color: BLUE}, {label: 'Abr', value: 47, color: BLUE}, {label: 'Mai', value: 43, color: BLUE}, {label: 'Jun', value: 52, color: BLUE}],
  };

  const entregasBar: Record<string, BarData[]> = {
    Semana:    [{label: 'No prazo', value: 9, color: GREEN}, {label: 'Atraso', value: 2, color: ORANGE}, {label: 'Antecip.', value: 1, color: BLUE}],
    Mês:       [{label: 'No prazo', value: 38, color: GREEN}, {label: 'Atraso', value: 5, color: ORANGE}, {label: 'Antecip.', value: 4, color: BLUE}],
    Trimestre: [{label: 'No prazo', value: 112, color: GREEN}, {label: 'Atraso', value: 14, color: ORANGE}, {label: 'Antecip.', value: 8, color: BLUE}],
    Ano:       [{label: 'No prazo', value: 440, color: GREEN}, {label: 'Atraso', value: 48, color: ORANGE}, {label: 'Antecip.', value: 24, color: BLUE}],
  };

  const estadoPie: PieSlice[] = [
    {label: 'Em Produção',      value: 18, color: '#3b82f6'},
    {label: 'Em Montagem',      value: 9,  color: ORANGE},
    {label: 'Em Expedição',     value: 6,  color: '#8b5cf6'},
    {label: 'Aguarda Material', value: 4,  color: '#eab308'},
    {label: 'Concluída',        value: 10, color: GREEN},
  ];

  const clientePie: PieSlice[] = [
    {label: 'Grupo Sonae',       value: 12, color: BLUE},
    {label: 'AEISCAC',           value: 9,  color: ORANGE},
    {label: 'Univ. do Minho',    value: 8,  color: GREEN},
    {label: 'Ascendi Operações', value: 7,  color: '#8b5cf6'},
    {label: 'Outros',            value: 11, color: Colors.gray400},
  ];

  return (
    <View style={styles.container}>
      <AppHeader
        section="RELATÓRIOS"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Period picker */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
              activeOpacity={0.85}>
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          <KpiCard label="OPs CRIADAS"  value={k.ops}         sub={`este ${period.toLowerCase()}`} color={BLUE}          />
          <KpiCard label="EFICIÊNCIA"   value={k.eficiencia}  sub="média produção"                  color={GREEN}         />
        </View>
        <View style={styles.kpiRow}>
          <KpiCard label="ENTREGAS OK"  value={k.entregas}    sub="taxa de pontualidade"            color={ORANGE}        />
          <KpiCard label="EM ATRASO"    value={k.atraso}      sub="ordens atrasadas"                color={Colors.danger} />
        </View>

        {/* Gráficos */}
        <BarChart data={prodBar[period] ?? []}     title={`ORDENS CRIADAS — ${period.toUpperCase()}`} />
        <BarChart data={entregasBar[period] ?? []} title="ESTADO DAS ENTREGAS" />
        <PieChart data={estadoPie}                 title="DISTRIBUIÇÃO POR ESTADO" />
        <PieChart data={clientePie}                title="TOP CLIENTES" />

      </ScrollView>

      <BottomNavBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  scroll: {flex: 1},
  scrollContent: {padding: Spacing.base, gap: Spacing.md, paddingBottom: Spacing['3xl']},
  periodRow: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12,
    padding: 4, gap: 4,
    shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2,
  },
  periodBtn: {flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center'},
  periodBtnActive: {backgroundColor: NAVY},
  periodText: {fontSize: 11, fontFamily: 'Exo2_700Bold', color: Colors.gray500},
  periodTextActive: {color: '#fff'},
  kpiRow: {flexDirection: 'row', gap: Spacing.md},
});
