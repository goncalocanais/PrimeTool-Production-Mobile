import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {MainNavigator} from './MainNavigator';
import {NotificacoesScreen} from '../screens/notifications/NotificacoesScreen';

export type AppStackParamList = {
  Main: undefined;
  Notificacoes: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

/**
 * AppNavigator envolve o MainNavigator (tabs) com ecrãs globais
 * como Notificações, acessíveis a partir de qualquer tab.
 */
export const AppNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Main" component={MainNavigator} />
    <Stack.Screen name="Notificacoes" component={NotificacoesScreen} options={{presentation: 'modal'}} />
  </Stack.Navigator>
);
