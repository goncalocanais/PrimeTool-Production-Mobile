import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Header, Card, Input, Button, LoadingOverlay} from '../../components/common';
import {Colors, Spacing} from '../../theme';
import {authApi} from '../../api/auth';

export const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!current) e.current = 'Insira a palavra-passe atual';
    if (!next || next.length < 8) e.next = 'Mínimo 8 caracteres';
    if (next !== confirm) e.confirm = 'As palavras-passe não coincidem';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
      await authApi.changePassword(current, next);
      Alert.alert('Sucesso', 'Palavra-passe alterada com sucesso', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch {
      setErrors({current: 'Palavra-passe atual incorreta'});
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Alterar Palavra-passe" showBack />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Card>
          <Input label="Palavra-passe Atual" value={current} onChangeText={setCurrent} error={errors.current} isPassword placeholder="••••••••" />
          <Input label="Nova Palavra-passe" value={next} onChangeText={setNext} error={errors.next} isPassword placeholder="Mínimo 8 caracteres" />
          <Input label="Confirmar Nova Palavra-passe" value={confirm} onChangeText={setConfirm} error={errors.confirm} isPassword placeholder="••••••••" />
        </Card>
        <Button label="Alterar Palavra-passe" onPress={handleChange} loading={isLoading} fullWidth size="lg" />
      </ScrollView>
      {isLoading && <LoadingOverlay visible message="A processar..." />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  content: {padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl']},
});
