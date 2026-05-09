import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import {Material, PedidoMaterial, PedidoCompra, MovimentoStock} from '../../types';
import {materialsApi} from '../../api/materials';

interface MaterialsState {
  materials: Material[];
  pedidosMaterial: PedidoMaterial[];
  pedidosCompra: PedidoCompra[];
  movimentos: MovimentoStock[];
  selectedMaterial: Material | null;
  alertasStockMinimo: Material[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MaterialsState = {
  materials: [],
  pedidosMaterial: [],
  pedidosCompra: [],
  movimentos: [],
  selectedMaterial: null,
  alertasStockMinimo: [],
  isLoading: false,
  error: null,
};

export const fetchMaterials = createAsyncThunk(
  'materials/fetchAll',
  async (search: string | void, {rejectWithValue}) => {
    try {
      return await materialsApi.getAll(search ?? undefined);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao carregar materiais');
    }
  },
);

export const fetchAlertasStock = createAsyncThunk(
  'materials/fetchAlertas',
  async (_arg: void, {rejectWithValue}) => {
    try {
      return await materialsApi.getAlertasStockMinimo();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao carregar alertas');
    }
  },
);

export const fetchPedidosMaterial = createAsyncThunk(
  'materials/fetchPedidos',
  async (_arg: void, {rejectWithValue}) => {
    try {
      return await materialsApi.getPedidosMaterial();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao carregar pedidos');
    }
  },
);

export const createPedidoMaterial = createAsyncThunk(
  'materials/createPedido',
  async (data: Partial<PedidoMaterial>, {rejectWithValue}) => {
    try {
      return await materialsApi.createPedidoMaterial(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao criar pedido');
    }
  },
);

export const responderPedidoMaterial = createAsyncThunk(
  'materials/responderPedido',
  async (
    {id, status, observacao}: {id: number; status: string; observacao?: string},
    {rejectWithValue},
  ) => {
    try {
      return await materialsApi.responderPedido(id, status, observacao);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao responder pedido');
    }
  },
);

export const registarMovimento = createAsyncThunk(
  'materials/registarMovimento',
  async (data: Partial<MovimentoStock>, {rejectWithValue}) => {
    try {
      return await materialsApi.registarMovimento(data);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao registar movimento');
    }
  },
);

export const fetchPedidosCompra = createAsyncThunk(
  'materials/fetchPedidosCompra',
  async (_arg: void, {rejectWithValue}) => {
    try {
      return await materialsApi.getPedidosCompra();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao carregar pedidos de compra');
    }
  },
);

const materialsSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setSelectedMaterial(state, action) {
      state.selectedMaterial = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMaterials.pending, state => {
        state.isLoading = true;
      })
      .addCase(fetchMaterials.fulfilled, (state, action) => {
        state.isLoading = false;
        state.materials = action.payload;
      })
      .addCase(fetchMaterials.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAlertasStock.fulfilled, (state, action) => {
        state.alertasStockMinimo = action.payload;
      })
      .addCase(fetchPedidosMaterial.fulfilled, (state, action) => {
        state.pedidosMaterial = action.payload;
      })
      .addCase(createPedidoMaterial.fulfilled, (state, action) => {
        state.pedidosMaterial.unshift(action.payload);
      })
      .addCase(responderPedidoMaterial.fulfilled, (state, action) => {
        const index = state.pedidosMaterial.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.pedidosMaterial[index] = action.payload;
        }
      })
      .addCase(registarMovimento.fulfilled, (state, action) => {
        state.movimentos.unshift(action.payload);
        const matIndex = state.materials.findIndex(m => m.id === action.payload.materialId);
        if (matIndex !== -1) {
          state.materials[matIndex].stockAtual = action.payload.quantidadeApos;
        }
      })
      .addCase(fetchPedidosCompra.fulfilled, (state, action) => {
        state.pedidosCompra = action.payload;
      });
  },
});

export const {clearError, setSelectedMaterial} = materialsSlice.actions;
export default materialsSlice.reducer;
