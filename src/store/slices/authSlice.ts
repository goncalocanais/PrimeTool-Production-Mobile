import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {AuthState, User, UserRole} from '../../types';
import {storage} from '../../utils/storage';
import {supabase} from '../../lib/supabase';

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Perfis mock para validar credenciais até haver auth real no backend.
// O perfil correto vem dos grupos do core_user na base de dados.
const MOCK_CREDENTIALS: Record<string, {password: string; perfil: UserRole; nome: string}> = {
  'direcao@primetool.pt':    {password: '123456', perfil: 'direcao',     nome: 'Direção'},
  'planeamento@primetool.pt':{password: '123456', perfil: 'planeamento', nome: 'Planeamento'},
  'armazem@primetool.pt':    {password: '123456', perfil: 'armazem',     nome: 'Armazém'},
  'producao@primetool.pt':   {password: '123456', perfil: 'producao',    nome: 'Produção'},
  'qualidade@primetool.pt':  {password: '123456', perfil: 'qualidade',   nome: 'Qualidade'},
  'expedicao@primetool.pt':  {password: '123456', perfil: 'expedicao',   nome: 'Expedição'},
  'montagem@primetool.pt':   {password: '123456', perfil: 'montagem',    nome: 'Montagem'},
};

async function fetchUserFromDB(email: string, fallbackPerfil: UserRole): Promise<User | null> {
  try {
    const {data, error} = await supabase
      .from('core_user')
      .select(`
        id, first_name, last_name, email, is_active,
        cargo_obj:core_cargo!cargo_id(nome),
        departamento_obj:core_departamento!departamento_id(nome),
        grupos:core_user_groups(grupo:auth_group!group_id(name))
      `)
      .eq('email', email)
      .single();

    if (error || !data) return null;
    const row = data as any;

    // O perfil vem do grupo Django correspondente
    const grupos: string[] = (row.grupos ?? [])
      .map((g: any) => g.grupo?.name)
      .filter(Boolean);
    const perfilFromDB = grupos.find((g: string) =>
      ['direcao','planeamento','armazem','producao','qualidade','expedicao','montagem'].includes(g),
    ) as UserRole | undefined;

    const cargoObj = Array.isArray(row.cargo_obj) ? row.cargo_obj[0] : row.cargo_obj;
    const deptObj = Array.isArray(row.departamento_obj) ? row.departamento_obj[0] : row.departamento_obj;

    return {
      id: row.id,
      nome: `${row.first_name} ${row.last_name}`.trim(),
      email: row.email,
      cargo: cargoObj?.nome ?? '—',
      departamento: deptObj?.nome ?? '—',
      perfil: perfilFromDB ?? fallbackPerfil,
      ativo: row.is_active,
    };
  } catch {
    return null;
  }
}

export const login = createAsyncThunk(
  'auth/login',
  async ({email, password}: {email: string; password: string}, {rejectWithValue}) => {
    try {
      const mock = MOCK_CREDENTIALS[email.toLowerCase()];
      if (!mock) return rejectWithValue('Email não encontrado');
      if (mock.password !== password) return rejectWithValue('Palavra-passe incorreta');

      // Tenta enriquecer com dados reais da BD; usa fallback mock se não encontrar
      const dbUser = await fetchUserFromDB(email.toLowerCase(), mock.perfil);
      const user: User = dbUser ?? {
        id: 0,
        nome: mock.nome,
        email,
        cargo: '—',
        departamento: '—',
        perfil: mock.perfil,
        ativo: true,
      };

      const token = 'session-' + mock.perfil + '-' + Date.now();
      await storage.setToken(token);
      await storage.setUser(user);
      return {token, user};
    } catch (error: any) {
      return rejectWithValue(error.message || 'Erro ao fazer login');
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await storage.clearAll();
});

export const restoreSession = createAsyncThunk('auth/restoreSession', async () => {
  const token = await storage.getToken();
  const user = await storage.getUser();
  if (token && user) return {token, user};
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
