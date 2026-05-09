import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {OrdersStackParamList} from '../types';
import {OrdersListScreen} from '../../screens/orders/OrdersListScreen';
import {OrderDetailScreen} from '../../screens/orders/OrderDetailScreen';
import {CreateOrderScreen} from '../../screens/orders/CreateOrderScreen';
import {UpdateProgressScreen} from '../../screens/production/UpdateProgressScreen';
import {PedidoAssistenciaScreen} from '../../screens/production/PedidoAssistenciaScreen';
import {PedidosAssistenciaListScreen} from '../../screens/production/PedidosAssistenciaListScreen';

const Stack = createNativeStackNavigator<OrdersStackParamList>();

export const OrdersNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="OrdersList" component={OrdersListScreen} />
    <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    <Stack.Screen name="CreateOrder" component={CreateOrderScreen} />
    <Stack.Screen name="UpdateProgress" component={UpdateProgressScreen} />
    <Stack.Screen name="PedidoAssistencia" component={PedidoAssistenciaScreen} />
    <Stack.Screen name="PedidosAssistenciaList" component={PedidosAssistenciaListScreen} />
  </Stack.Navigator>
);
