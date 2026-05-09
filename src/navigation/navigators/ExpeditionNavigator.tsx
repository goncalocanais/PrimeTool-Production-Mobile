import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {ExpeditionStackParamList} from '../types';
import {ExpedicoesListScreen} from '../../screens/expedition/ExpedicoesListScreen';
import {ExpedicaoDetailScreen} from '../../screens/expedition/ExpedicaoDetailScreen';
import {CreateExpedicaoScreen} from '../../screens/expedition/CreateExpedicaoScreen';

const Stack = createNativeStackNavigator<ExpeditionStackParamList>();

export const ExpeditionNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="ExpedicoesList" component={ExpedicoesListScreen} />
    <Stack.Screen name="ExpedicaoDetail" component={ExpedicaoDetailScreen} />
    <Stack.Screen name="CreateExpedicao" component={CreateExpedicaoScreen} />
  </Stack.Navigator>
);
