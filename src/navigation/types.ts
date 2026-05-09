import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';

// Auth
export type AuthStackParamList = {
  Login: undefined;
};

// Orders
export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderDetail: {id: number};
  CreateOrder: undefined;
  UpdateProgress: {id: number};
  PedidoAssistencia: {ordemId: number};
  PedidosAssistenciaList: undefined;
};

// Materials
export type MaterialsStackParamList = {
  MaterialsList: undefined;
  MaterialDetail: {id: number};
  PedidosMaterialList: undefined;
  CreatePedidoMaterial: {ordemId?: number};
  PedidosCompraList: undefined;
  CreatePedidoCompra: undefined;
  MovimentosStock: {materialId?: number};
};

// Quality
export type QualityStackParamList = {
  InspeccoesList: undefined;
  InspeccaoDetail: {id: number};
  CreateInspeccao: {ordemId: number};
  NaoConformidadesList: undefined;
  CreateNaoConformidade: {inspeccaoId: number};
};

// Expedition
export type ExpeditionStackParamList = {
  ExpedicoesList: undefined;
  ExpedicaoDetail: {id: number};
  CreateExpedicao: {ordemId?: number};
};

// HR
export type HRStackParamList = {
  ColaboradoresList: undefined;
  ColaboradorDetail: {id: number};
  CreateColaborador: undefined;
  DepartamentosList: undefined;
};

// Profile
export type ProfileStackParamList = {
  Profile: undefined;
  ChangePassword: undefined;
};

// Main tabs (comuns a todos os perfis)
export type MainTabParamList = {
  Dashboard: undefined;
  Orders: undefined;
  Materials: undefined;
  Quality: undefined;
  Expedition: undefined;
  HR: undefined;
  Profile: undefined;
};
