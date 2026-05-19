// ─── Perfis / Departamentos ────────────────────────────────────────────────────
export type UserRole =
  | 'direcao'
  | 'planeamento'
  | 'armazem'
  | 'producao'
  | 'qualidade'
  | 'expedicao'
  | 'montagem';

export interface User {
  id: number;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  perfil: UserRole;
  avatar?: string;
  ativo: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ─── Ordens de Produção ────────────────────────────────────────────────────────
export type OPStatus =
  | 'planeamento'
  | 'em_producao'
  | 'qualidade'
  | 'expedicao'
  | 'montagem'
  | 'concluida'
  | 'cancelada';

export interface OrdemProducao {
  id: number;
  referencia: string;
  cliente: string;
  descricao: string;
  quantidade: number;
  dataInicio: string;
  dataFimPrevista: string;
  dataFimReal?: string;
  status: OPStatus;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  progresso: number; // 0-100
  responsavel?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Materiais & Stock ─────────────────────────────────────────────────────────
export interface Material {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  unidade: string;
  stockAtual: number;
  stockMinimo: number;
  localizacao?: string;
  precoUnitario?: number;
}

export type MovimentoTipo = 'entrada' | 'saida' | 'ajuste' | 'transferencia';

export interface MovimentoStock {
  id: number;
  materialId: number;
  material?: Material;
  tipo: MovimentoTipo;
  quantidade: number;
  quantidadeAnterior: number;
  quantidadeApos: number;
  motivo?: string;
  utilizador: string;
  data: string;
}

// ─── Pedidos de Material ───────────────────────────────────────────────────────
export type PedidoMaterialStatus =
  | 'pendente'
  | 'aprovado'
  | 'rejeitado'
  | 'em_separacao'
  | 'entregue';

export interface PedidoMaterial {
  id: number;
  referencia: string;
  ordemProducaoId: number;
  ordemProducao?: OrdemProducao;
  materialId: number;
  material?: Material;
  quantidade: number;
  justificacao: string;
  status: PedidoMaterialStatus;
  solicitadoPor: string;
  solicitadoEm: string;
  respondidoPor?: string;
  respondidoEm?: string;
  observacaoResposta?: string;
  entregueEm?: string;
}

// ─── Pedidos de Assistência ────────────────────────────────────────────────────
export type AssistenciaStatus = 'pendente' | 'em_analise' | 'respondido' | 'fechado';

export interface PedidoAssistencia {
  id: number;
  referencia: string;
  ordemProducaoId: number;
  ordemProducao?: OrdemProducao;
  titulo: string;
  descricao: string;
  status: AssistenciaStatus;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  solicitadoPor: string;
  solicitadoEm: string;
  respondidoPor?: string;
  respondidoEm?: string;
  resposta?: string;
}

// ─── Qualidade ─────────────────────────────────────────────────────────────────
export type InspeccaoTipo = 'intermedia' | 'final';
export type InspeccaoResultado = 'aprovado' | 'reprovado' | 'aprovado_com_ressalvas';

export interface InspeccaoQualidade {
  id: number;
  referencia: string;
  ordemProducaoId: number;
  ordemProducao?: OrdemProducao;
  tipo: InspeccaoTipo;
  resultado?: InspeccaoResultado;
  inspector: string;
  dataInspeccao: string;
  observacoes?: string;
  naoConformidades?: NaoConformidade[];
}

export type NaoConformidadeStatus = 'aberta' | 'em_analise' | 'corrigida' | 'fechada';

export interface NaoConformidade {
  id: number;
  inspeccaoId: number;
  descricao: string;
  gravidade: 'menor' | 'maior' | 'critica';
  acaoCorretiva?: string;
  status: NaoConformidadeStatus;
  responsavel?: string;
  prazo?: string;
  resolvidaEm?: string;
}

// ─── Expedição ─────────────────────────────────────────────────────────────────
export type ExpedicaoStatus =
  | 'pendente'
  | 'em_preparacao'
  | 'pronto'
  | 'enviado'
  | 'entregue';

export interface Expedicao {
  id: number;
  referencia: string;
  ordemProducaoId: number;
  ordemProducao?: OrdemProducao;
  destinatario: string;
  moradaEntrega: string;
  transportadora?: string;
  guiaTransporte?: string;
  status: ExpedicaoStatus;
  dataPrevisaoEntrega?: string;
  dataEnvio?: string;
  dataEntrega?: string;
  peso?: number;
  volumes?: number;
  observacoes?: string;
  criadoPor: string;
}

// ─── Progresso de Produção ─────────────────────────────────────────────────────
export interface RegistoProgresso {
  id: number;
  ordemProducaoId: number;
  percentagem: number;
  descricao: string;
  operador: string;
  data: string;
}

// ─── Offline Queue ─────────────────────────────────────────────────────────────
export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retries: number;
}

// ─── API Response ──────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
}

// ─── Dashboard KPIs ────────────────────────────────────────────────────────────
export interface DashboardKPIs {
  opsAtivas: number;
  opsPlaneamento: number;
  opsEmProducao: number;
  opsQualidade: number;
  opsExpedicao: number;
  opsConcluidas: number;
  pedidosMaterialPendentes: number;
  alertasStockMinimo: number;
  naoConformidadesAbertas: number;
}
