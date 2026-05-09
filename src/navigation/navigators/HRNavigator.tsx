import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {HRStackParamList} from '../types';
import {ColaboradoresListScreen} from '../../screens/hr/ColaboradoresListScreen';
import {ColaboradorDetailScreen} from '../../screens/hr/ColaboradorDetailScreen';
import {CreateColaboradorScreen} from '../../screens/hr/CreateColaboradorScreen';
import {DepartamentosListScreen} from '../../screens/hr/DepartamentosListScreen';

const Stack = createNativeStackNavigator<HRStackParamList>();

export const HRNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="ColaboradoresList" component={ColaboradoresListScreen} />
    <Stack.Screen name="ColaboradorDetail" component={ColaboradorDetailScreen} />
    <Stack.Screen name="CreateColaborador" component={CreateColaboradorScreen} />
    <Stack.Screen name="DepartamentosList" component={DepartamentosListScreen} />
  </Stack.Navigator>
);
