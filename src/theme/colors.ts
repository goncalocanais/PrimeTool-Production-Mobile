export const Colors = {
  // PrimeTool Brand
  primary: '#0d1b4b',       // --navy
  primaryLight: '#0094ff',  // --blue
  primaryDark: '#0078d4',   // --blue-dk
  primaryUltraLight: '#f8faff',

  // Actions
  success: '#00b85c',       // --green
  successLight: '#d1e7dd',
  successText: '#0a3622',
  warning: '#ff7700',       // --orange
  warningLight: '#fff3cd',
  warningText: '#856404',
  danger: '#e53935',
  dangerLight: '#f8d7da',
  dangerText: '#58151c',
  info: '#0094ff',
  infoLight: '#cfe2ff',
  infoText: '#084298',

  // Neutrals
  white: '#ffffff',
  black: '#000000',
  gray50: '#f5f7fa',        // --bg
  gray100: '#f8faff',
  gray200: '#d0d8e8',       // --border
  gray300: '#ccc',
  gray400: '#bbb',
  gray500: '#aaa',
  gray600: '#888',
  gray700: '#666',
  gray800: '#555',
  gray900: '#1a2340',       // --text

  // Background
  background: '#f5f7fa',    // --bg
  surface: '#ffffff',
  border: '#d0d8e8',        // --border

  // OP Status badges (bg / text pairs from design system)
  opPlaneamento: '#0094ff',
  opPlaneamentoLight: '#cfe2ff',
  opPlaneamentoText: '#084298',
  opEmProducao: '#0094ff',
  opEmProducaoLight: '#cfe2ff',
  opEmProducaoText: '#084298',
  opQualidade: '#ff7700',
  opQualidadeLight: '#fff3cd',
  opQualidadeText: '#856404',
  opExpedicao: '#432874',
  opExpedicaoLight: '#e2d9f3',
  opExpedicaoText: '#432874',
  opMontagem: '#7a3e00',
  opMontagemLight: '#fde8c8',
  opMontagemText: '#7a3e00',
  opConcluida: '#00b85c',
  opConcluidaLight: '#d1e7dd',
  opConcluidaText: '#0a3622',
  opCancelada: '#e53935',
  opCanceladaLight: '#f8d7da',
  opCanceladaText: '#58151c',
  opPendente: '#856404',
  opPendenteLight: '#fff3cd',
  opPendenteText: '#856404',

  // Pedido status
  pedidoPendente: '#ff7700',
  pedidoPendenteLight: '#fff3cd',
  pedidoPendenteText: '#856404',
  pedidoAprovado: '#00b85c',
  pedidoAprovadoLight: '#d1e7dd',
  pedidoAprovadoText: '#0a3622',
  pedidoRejeitado: '#e53935',
  pedidoRejeitadoLight: '#f8d7da',
  pedidoRejeitadoText: '#58151c',
  pedidoEntregue: '#0094ff',
  pedidoEntregueLight: '#cfe2ff',
  pedidoEntregueText: '#084298',
};

export type ColorKey = keyof typeof Colors;
