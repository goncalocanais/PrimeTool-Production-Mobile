import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {MaterialsStackParamList} from '../types';
import {MaterialsListScreen} from '../../screens/materials/MaterialsListScreen';
import {MaterialDetailScreen} from '../../screens/materials/MaterialDetailScreen';
import {PedidosMaterialListScreen} from '../../screens/materials/PedidosMaterialListScreen';
import {CreatePedidoMaterialScreen} from '../../screens/materials/CreatePedidoMaterialScreen';
import {MovimentosStockScreen} from '../../screens/materials/MovimentosStockScreen';

const Stack = createNativeStackNavigator<MaterialsStackParamList>();

export const MaterialsNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="MaterialsList" component={MaterialsListScreen} />
    <Stack.Screen name="MaterialDetail" component={MaterialDetailScreen} />
    <Stack.Screen name="PedidosMaterialList" component={PedidosMaterialListScreen} />
    <Stack.Screen name="CreatePedidoMaterial" component={CreatePedidoMaterialScreen} />
    <Stack.Screen name="MovimentosStock" component={MovimentosStockScreen} />
  </Stack.Navigator>
);
