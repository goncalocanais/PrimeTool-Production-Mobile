import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {AuthState, User} from '../../types';
import {authApi} from '../../api/auth';
import {storage} from '../../utils/storage';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Utilizadores mock para testes (remover quando backend estiver disponível)
const MOCK_USERS: Record<string, {password: string; user: User}> = {
  'direcao@primetool.pt': {
    password: '123456',
    user: {id: 1, nome: 'Ana Silva', email: 'direcao@primetool.pt', cargo: 'Diretora Geral', departamento: 'Direção', perfil: 'direcao', ativo: true},
  },
  'rh@primetool.pt': {
    password: '123456',
    user: {id: 2, nome: 'Carlos Santos', email: 'rh@primetool.pt', cargo: 'Técnico RH', departamento: 'Recursos Humanos', perfil: 'rh', ativo: true},
  },
  'planeamento@primetool.pt': {
    password: '123456',
    user: {id: 3, nome: 'Mariana Costa', email: 'planeamento@primetool.pt', cargo: 'Técnica de Planeamento', departamento: 'Planeamento', perfil: 'planeamento', ativo: true},
  },
  'armazem@primetool.pt': {
    password: '123456',
    user: {id: 4, nome: 'João Ferreira', email: 'armazem@primetool.pt', cargo: 'Chefe de Armazém', departamento: 'Armazém', perfil: 'armazem', ativo: true},
  },
  'producao@primetool.pt': {
    password: '123456',
    user: {id: 5, nome: 'Pedro Oliveira', email: 'producao@primetool.pt', cargo: 'Operador de Produção', departamento: 'Produção', perfil: 'producao', ativo: true},
  },
  'qualidade@primetool.pt': {
    password: '123456',
    user: {id: 6, nome: 'Sofia Martins', email: 'qualidade@primetool.pt', cargo: 'Técnica de Qualidade', departamento: 'Qualidade', perfil: 'qualidade', ativo: true},
  },
  'expedicao@primetool.pt': {
    password: '123456',
    user: {id: 7, nome: 'Rui Gomes', email: 'expedicao@primetool.pt', cargo: 'Responsável de Expedição', departamento: 'Expedição', perfil: 'expedicao', ativo: true},
  },
  'montagem@primetool.pt': {
    password: '123456',
    user: {id: 8, nome: 'Filipa Rodrigues', email: 'montagem@primetool.pt', cargo: 'Técnica de Montagem', departamento: 'Montagem', perfil: 'montagem', ativo: true},
  },
};

export const login = createAsyncThunk(
  'auth/login',
  async ({email, password}: {email: string; password: string}, {rejectWithValue}) => {
    try {
      // Mock login — substituir por authApi.login quando backend estiver disponível
      const mock = MOCK_USERS[email.toLowerCase()];
      if (mock && mock.password === password) {
        const response = {token: 'mock-token-' + mock.user.perfil, user: mock.user};
        await storage.setToken(response.token);
        await storage.setUser(response.user);
        return response;
      }
      if (!mock) {
        return rejectWithValue('Email não encontrado');
      }
      return rejectWithValue('Palavra-passe incorreta');
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erro ao fazer login');
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await storage.clearAll();
});

export const restoreSession = createAsyncThunk('auth/restoreSession', async () => {
  const token = await storage.getToken();
  const user = await storage.getUser();
  if (token && user) {
    return {token, user};
  }
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = {...state.user, ...action.payload};
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(login.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, state => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
      });
  },
});

export const {clearError, updateUser} = authSlice.actions;
export default authSlice.reducer;
