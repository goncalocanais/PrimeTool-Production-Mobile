import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {OrdemProducao, OPStatus} from '../../types';
import {ordersApi} from '../../api/orders';

interface OrdersState {
  orders: OrdemProducao[];
  selectedOrder: OrdemProducao | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status?: OPStatus;
    search?: string;
  };
}

const MOCK_ORDERS: OrdemProducao[] = [
  {id: 8, referencia: '2026-0008', cliente: 'ADRC Vasco da Gama', descricao: 'Painel luminoso Vasco da Gama', quantidade: 1, dataInicio: '2026-04-01T08:00:00Z', dataFimPrevista: '2026-04-26T18:00:00Z', status: 'montagem', prioridade: 'alta', progresso: 75, createdAt: '2026-04-01T08:00:00Z', updatedAt: '2026-04-20T10:00:00Z'},
  {id: 7, referencia: '2026-0007', cliente: 'Ascendi Operações, SA', descricao: 'Letreiro entrada hotel', quantidade: 2, dataInicio: '2026-03-20T08:00:00Z', dataFimPrevista: '2026-04-30T18:00:00Z', status: 'expedicao', prioridade: 'normal' as any, progresso: 90, createdAt: '2026-03-20T08:00:00Z', updatedAt: '2026-04-22T10:00:00Z'},
  {id: 6, referencia: '2026-0006', cliente: 'AEISCAC', descricao: 'Letreiro entrada piso 0', quantidade: 1, dataInicio: '2026-03-15T08:00:00Z', dataFimPrevista: '2026-04-28T18:00:00Z', status: 'expedicao', prioridade: 'normal' as any, progresso: 95, createdAt: '2026-03-15T08:00:00Z', updatedAt: '2026-04-23T10:00:00Z'},
  {id: 5, referencia: '2026-0005', cliente: 'Universidade do Minho', descricao: 'Sinalética exterior campus', quantidade: 12, dataInicio: '2026-03-10T08:00:00Z', dataFimPrevista: '2026-05-10T18:00:00Z', status: 'em_producao', prioridade: 'media', progresso: 50, createdAt: '2026-03-10T08:00:00Z', updatedAt: '2026-04-18T10:00:00Z'},
  {id: 4, referencia: '2026-0004', cliente: 'Grupo Sonae', descricao: 'Painel LED fachada', quantidade: 1, dataInicio: '2026-03-05T08:00:00Z', dataFimPrevista: '2026-05-15T18:00:00Z', status: 'planeamento', prioridade: 'urgente', progresso: 10, createdAt: '2026-03-05T08:00:00Z', updatedAt: '2026-04-15T10:00:00Z'},
  {id: 3, referencia: '2026-0003', cliente: 'NOS Comunicações', descricao: 'Totem publicitário exterior', quantidade: 3, dataInicio: '2026-02-20T08:00:00Z', dataFimPrevista: '2026-04-15T18:00:00Z', status: 'qualidade', prioridade: 'alta', progresso: 85, createdAt: '2026-02-20T08:00:00Z', updatedAt: '2026-04-10T10:00:00Z'},
  {id: 2, referencia: '2026-0002', cliente: 'Câmara Municipal de Coimbra', descricao: 'Painéis informativos parque', quantidade: 6, dataInicio: '2026-02-01T08:00:00Z', dataFimPrevista: '2026-03-30T18:00:00Z', status: 'concluida', prioridade: 'media', progresso: 100, createdAt: '2026-02-01T08:00:00Z', updatedAt: '2026-03-30T10:00:00Z'},
  {id: 1, referencia: '2026-0001', cliente: 'EDP Renováveis', descricao: 'Sinalização parque solar', quantidade: 20, dataInicio: '2026-01-15T08:00:00Z', dataFimPrevista: '2026-03-01T18:00:00Z', status: 'concluida', prioridade: 'baixa', progresso: 100, createdAt: '2026-01-15T08:00:00Z', updatedAt: '2026-03-01T10:00:00Z'},
];

const initialState: OrdersState = {
  orders: MOCK_ORDERS,
  selectedOrder: null,
  isLoading: false,
  error: null,
  filters: {},
};

export const fetchOrders = createAsyncThunk(
  'orders/fetchAll',
  async (params: {status?: OPStatus; search?: string} | void, {rejectWithValue}) => {
    const p = params ?? {};
    try {
      return await ordersApi.getAll(p);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao carregar ordens');
    }
  },
);

export const fetchOrderById = createAsyncThunk(
  'orders/fetchById',
  async (id: number, {rejectWithValue}) => {
    try {
      return await ordersApi.getById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao carregar ordem');
    }
  },
);

export const createOrder = createAsyncThunk(
  'orders/create',
  async (data: Partial<OrdemProducao>, {rejectWithValue}) => {
    try {
      return await ordersApi.create(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao criar ordem');
    }
  },
);

export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({id, status}: {id: number; status: OPStatus}, {rejectWithValue}) => {
    try {
      return await ordersApi.updateStatus(id, status);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar estado');
    }
  },
);

export const updateOrderProgress = createAsyncThunk(
  'orders/updateProgress',
  async (
    {id, progresso, descricao}: {id: number; progresso: number; descricao: string},
    {rejectWithValue},
  ) => {
    try {
      return await ordersApi.updateProgress(id, progresso, descricao);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao atualizar progresso');
    }
  },
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<OrdersState['filters']>) {
      state.filters = action.payload;
    },
    clearSelectedOrder(state) {
      state.selectedOrder = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchOrders.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchOrderById.pending, state => {
        state.isLoading = true;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedOrder = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.orders.unshift(action.payload);
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
      })
      .addCase(updateOrderProgress.fulfilled, (state, action) => {
        const index = state.orders.findIndex(o => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        if (state.selectedOrder?.id === action.payload.id) {
          state.selectedOrder = action.payload;
        }
      });
  },
});

export const {setFilters, clearSelectedOrder, clearError} = ordersSlice.actions;
export default ordersSlice.reducer;
