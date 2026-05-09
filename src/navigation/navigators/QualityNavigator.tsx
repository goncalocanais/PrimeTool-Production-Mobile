import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {QualityStackParamList} from '../types';
import {InspeccoesListScreen} from '../../screens/quality/InspeccoesListScreen';
import {InspeccaoDetailScreen} from '../../screens/quality/InspeccaoDetailScreen';
import {CreateInspeccaoScreen} from '../../screens/quality/CreateInspeccaoScreen';
import {NaoConformidadesListScreen} from '../../screens/quality/NaoConformidadesListScreen';
import {CreateNaoConformidadeScreen} from '../../screens/quality/CreateNaoConformidadeScreen';

const Stack = createNativeStackNavigator<QualityStackParamList>();

export const QualityNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="InspeccoesList" component={InspeccoesListScreen} />
    <Stack.Screen name="InspeccaoDetail" component={InspeccaoDetailScreen} />
    <Stack.Screen name="CreateInspeccao" component={CreateInspeccaoScreen} />
    <Stack.Screen name="NaoConformidadesList" component={NaoConformidadesListScreen} />
    <Stack.Screen name="CreateNaoConformidade" component={CreateNaoConformidadeScreen} />
  </Stack.Navigator>
);
