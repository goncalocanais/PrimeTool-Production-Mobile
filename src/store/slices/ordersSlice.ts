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

const initialState: OrdersState = {
  orders: [],
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
