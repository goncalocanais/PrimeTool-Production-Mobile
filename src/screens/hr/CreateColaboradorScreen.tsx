import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, Text, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Header, Card, Input, Button, LoadingOverlay} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {UserRole} from '../../types';
import {hrApi} from '../../api/hr';

const PERFIS: {value: UserRole; label: string}[] = [
  {value: 'direcao', label: 'Direção'},
  {value: 'rh', label: 'RH'},
  {value: 'planeamento', label: 'Planeamento'},
  {value: 'armazem', label: 'Armazém'},
  {value: 'producao', label: 'Produção'},
  {value: 'qualidade', label: 'Qualidade'},
  {value: 'expedicao', label: 'Expedição'},
  {value: 'montagem', label: 'Montagem'},
];

export const CreateColaboradorScreen: React.FC = () => {
  const navigation = useNavigation();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState('');
  const [perfil, setPerfil] = useState<UserRole>('producao');
  const [departamentoId, setDepartamentoId] = useState<number | null>(null);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { hrApi.getDepartamentos().then(setDepartamentos); }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'O nome é obrigatório';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = 'Email inválido';
    if (!cargo.trim()) e.cargo = 'O cargo é obrigatório';
    if (!departamentoId) e.departamento = 'Selecione um departamento';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await hrApi.createColaborador({nome, email, telefone: telefone || undefined, cargo, perfil, departamentoId: departamentoId!, ativo: true, dataAdmissao: new Date().toISOString()});
      navigation.goBack();
    } finally { setIsLoading(false); }
  };

  return (
    <View style={styles.container}>
      <Header title="Novo Colaborador" showBack />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Card>
          <Input label="Nome *" placeholder="Nome completo" value={nome} onChangeText={setNome} error={errors.nome} />
          <Input label="Email *" placeholder="email@empresa.pt" value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
          <Input label="Telefone" placeholder="9XX XXX XXX" value={telefone} onChangeText={setTelefone} keyboardType="phone-pad" />
          <Input label="Cargo *" placeholder="Ex: Operador de Produção" value={cargo} onChangeText={setCargo} error={errors.cargo} />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Perfil de Acesso</Text>
          <View style={styles.grid}>
            {PERFIS.map(p => (
              <TouchableOpacity key={p.value} style={[styles.item, perfil === p.value && styles.itemActive]} onPress={() => setPerfil(p.value)}>
                <Text style={[styles.itemText, perfil === p.value && styles.itemTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Departamento *</Text>
          {errors.departamento && <Text style={styles.errorText}>{errors.departamento}</Text>}
          {departamentos.map(d => (
            <TouchableOpacity key={d.id} style={[styles.item, departamentoId === d.id && styles.itemActive]} onPress={() => setDepartamentoId(d.id)}>
              <Text style={[styles.itemText, departamentoId === d.id && styles.itemTextActive]}>{d.nome}</Text>
            </TouchableOpacity>
          ))}
        </Card>

        <Button label="Criar Colaborador" onPress={handleCreate} loading={isLoading} fullWidth size="lg" />
      </ScrollView>
      {isLoading && <LoadingOverlay visible message="A criar colaborador..." />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  content: {padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl']},
  sectionTitle: {fontSize: FontSize.base, fontWeight: FontWeight.semibold as any, color: Colors.gray800, marginBottom: Spacing.sm},
  errorText: {fontSize: FontSize.xs, color: Colors.danger, marginBottom: Spacing.sm},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm},
  item: {paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border},
  itemActive: {backgroundColor: Colors.primary, borderColor: Colors.primary},
  itemText: {fontSize: FontSize.sm, color: Colors.gray700, fontWeight: FontWeight.medium as any},
  itemTextActive: {color: Colors.white},
});
