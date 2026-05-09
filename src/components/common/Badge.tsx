import React from 'react';
import {View, Text, StyleSheet, ViewStyle} from 'react-native';
import {Colors, BorderRadius, FontSize, FontWeight} from '../../theme';
import {OPStatus, PedidoMaterialStatus} from '../../types';

type StatusType = OPStatus | PedidoMaterialStatus | string;

interface BadgeProps {
  status: StatusType;
  style?: ViewStyle;
}

const statusConfig: Record<string, {label: string; bg: string; color: string}> = {
  // OP Status
  planeamento: {label: 'Planeamento', bg: Colors.opPlaneamentoLight, color: Colors.opPlaneamento},
  em_producao: {label: 'Em Produção', bg: Colors.opEmProducaoLight, color: Colors.opEmProducao},
  qualidade: {label: 'Qualidade', bg: Colors.opQualidadeLight, color: Colors.opQualidade},
  expedicao: {label: 'Expedição', bg: Colors.opExpedicaoLight, color: Colors.opExpedicao},
  montagem: {label: 'Montagem', bg: Colors.opMontagemLight, color: Colors.opMontagem},
  concluida: {label: 'Concluída', bg: Colors.opConcluidaLight, color: Colors.opConcluida},
  cancelada: {label: 'Cancelada', bg: Colors.opCanceladaLight, color: Colors.opCancelada},

  // Pedido material
  pendente: {label: 'Pendente', bg: Colors.pedidoPendenteLight, color: Colors.pedidoPendente},
  aprovado: {label: 'Aprovado', bg: Colors.pedidoAprovadoLight, color: Colors.pedidoAprovado},
  rejeitado: {label: 'Rejeitado', bg: Colors.pedidoRejeitadoLight, color: Colors.pedidoRejeitado},
  em_separacao: {label: 'Em Separação', bg: Colors.infoLight, color: Colors.info},
  entregue: {label: 'Entregue', bg: Colors.pedidoEntregueLight, color: Colors.pedidoEntregue},

  // Pedido compra
  enviado: {label: 'Enviado', bg: Colors.infoLight, color: Colors.info},
  recepcao_parcial: {label: 'Recep. Parcial', bg: Colors.warningLight, color: Colors.warning},
  recebido: {label: 'Recebido', bg: Colors.successLight, color: Colors.success},

  // Prioridade
  baixa: {label: 'Baixa', bg: Colors.gray100, color: Colors.gray600},
  media: {label: 'Média', bg: Colors.infoLight, color: Colors.info},
  alta: {label: 'Alta', bg: Colors.warningLight, color: Colors.warning},
  urgente: {label: 'Urgente', bg: Colors.dangerLight, color: Colors.danger},

  // Assistência
  em_analise: {label: 'Em Análise', bg: Colors.infoLight, color: Colors.info},
  respondido: {label: 'Respondido', bg: Colors.successLight, color: Colors.success},
  fechado: {label: 'Fechado', bg: Colors.gray100, color: Colors.gray600},

  // Qualidade
  aprovado_com_ressalvas: {label: 'Aprovado c/ ressalvas', bg: Colors.warningLight, color: Colors.warning},
  reprovado: {label: 'Reprovado', bg: Colors.dangerLight, color: Colors.danger},

  // Stock
  em_preparacao: {label: 'Em Preparação', bg: Colors.infoLight, color: Colors.info},
  pronto: {label: 'Pronto', bg: Colors.successLight, color: Colors.success},
};

export const Badge: React.FC<BadgeProps> = ({status, style}) => {
  const config = statusConfig[status] ?? {
    label: status,
    bg: Colors.gray100,
    color: Colors.gray600,
  };

  return (
    <View style={[styles.badge, {backgroundColor: config.bg}, style]}>
      <Text style={[styles.text, {color: config.color}]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold as any,
  },
});
