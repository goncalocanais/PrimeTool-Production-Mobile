import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useAppDispatch, useAppSelector} from '../../store';
import {registarMovimento} from '../../store/slices/materialsSlice';
import {Header, Card, Button, Input, LoadingOverlay} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {materialsApi} from '../../api/materials';
import {Material} from '../../types';

export const MaterialDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const {id} = route.params;
  const user = useAppSelector(s => s.auth.user);
  const {isLoading} = useAppSelector(s => s.materials);

  const [material, setMaterial] = useState<Material | null>(null);
  const [showMovimento, setShowMovimento] = useState(false);
  const [tipoMovimento, setTipoMovimento] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');

  const canManage = ['armazem', 'direcao'].includes(user?.perfil ?? '');

  useEffect(() => {
    materialsApi.getById(id).then(setMaterial);
  }, [id]);

  if (!material) return <LoadingOverlay visible message="A carregar..." />;

  const isLow = material.stockAtual <= material.stockMinimo;

  const handleMovimento = async () => {
    if (!quantidade || Number(quantidade) <= 0) {
      Alert.alert('Erro', 'Insira uma quantidade válida');
      return;
    }
    await dispatch(
      registarMovimento({
        materialId: material.id,
        tipo: tipoMovimento,
        quantidade: Number(quantidade),
        motivo,
      }),
    );
    setShowMovimento(false);
    setQuantidade('');
    setMotivo('');
    const updated = await materialsApi.getById(id);
    setMaterial(updated);
  };

  return (
    <View style={styles.container}>
      <Header title={material.codigo} subtitle={material.nome} showBack />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Card style={isLow ? [styles.stockCard, styles.stockCardAlert] : styles.stockCard}>
          <Text style={styles.stockLabel}>Stock Atual</Text>
          <Text style={[styles.stockValue, isLow ? styles.stockLow : styles.stockOk]}>
            {material.stockAtual} {material.unidade}
          </Text>
          {isLow && <Text style={styles.alertMsg}>⚠️ Stock abaixo do mínimo ({material.stockMinimo})</Text>}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Informações</Text>
          {(
            [
              ['Código', material.codigo],
              ['Nome', material.nome],
              ['Unidade', material.unidade],
              ['Stock Mínimo', `${material.stockMinimo} ${material.unidade}`],
              ...(material.localizacao ? [['Localização', material.localizacao]] : []),
              ...(material.precoUnitario ? [['Preço Unit.', `€${material.precoUnitario.toFixed(2)}`]] : []),
            ] as [string, string][]
          ).map(([label, value]) => (
            <View key={label} style={styles.infoRow}>
              <Text style={styles.infoLabel}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </Card>

        {canManage && (
          <View style={styles.actionsRow}>
            <Button
              label="Registar Movimento"
              onPress={() => setShowMovimento(!showMovimento)}
              variant={showMovimento ? 'outline' : 'primary'}
              fullWidth
            />
          </View>
        )}

        {showMovimento && (
          <Card>
            <Text style={styles.cardTitle}>Novo Movimento</Text>
            <View style={styles.tipoRow}>
              {(['entrada', 'saida', 'ajuste'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tipoBtn, tipoMovimento === t && styles.tipoBtnActive]}
                  onPress={() => setTipoMovimento(t)}>
                  <Text style={[styles.tipoText, tipoMovimento === t && styles.tipoTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input
              label="Quantidade"
              value={quantidade}
              onChangeText={setQuantidade}
              keyboardType="numeric"
              placeholder="0"
            />
            <Input
              label="Motivo (opcional)"
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Descreva o motivo..."
              multiline
            />
            <Button label="Registar" onPress={handleMovimento} loading={isLoading} fullWidth />
          </Card>
        )}

        <Button
          label="Ver Movimentos"
          onPress={() => navigation.navigate('MovimentosStock', {materialId: material.id})}
          variant="outline"
          fullWidth
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  content: {padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl']},
  stockCard: {alignItems: 'center', padding: Spacing.xl},
  stockCardAlert: {borderWidth: 2, borderColor: Colors.warning},
  stockLabel: {fontSize: FontSize.sm, color: Colors.gray500, marginBottom: Spacing.xs},
  stockValue: {fontSize: 48, fontWeight: FontWeight.bold as any},
  stockOk: {color: Colors.success},
  stockLow: {color: Colors.warning},
  alertMsg: {fontSize: FontSize.sm, color: Colors.warning, fontWeight: FontWeight.medium as any, marginTop: Spacing.xs},
  cardTitle: {fontSize: FontSize.base, fontWeight: FontWeight.semibold as any, color: Colors.gray800, marginBottom: Spacing.md},
  infoRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.gray100},
  infoLabel: {fontSize: FontSize.sm, color: Colors.gray500},
  infoValue: {fontSize: FontSize.sm, color: Colors.gray800, fontWeight: FontWeight.medium as any},
  actionsRow: {gap: Spacing.sm},
  tipoRow: {flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base},
  tipoBtn: {flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center'},
  tipoBtnActive: {backgroundColor: Colors.primary, borderColor: Colors.primary},
  tipoText: {fontSize: FontSize.sm, color: Colors.gray600, fontWeight: FontWeight.medium as any},
  tipoTextActive: {color: Colors.white},
});
