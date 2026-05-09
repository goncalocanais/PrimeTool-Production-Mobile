import {Middleware} from '@reduxjs/toolkit';
import {toast} from '../../utils/toast';

/**
 * Middleware que dispara toasts automáticos com base nas ações Redux.
 * Regras: action.type que termina em /fulfilled ou /rejected.
 */
const MESSAGES: Record<string, {success?: string; error?: string}> = {
  'orders/updateStatus': {
    success: 'Estado da ordem atualizado',
    error: 'Erro ao atualizar estado',
  },
  'orders/updateProgress': {
    success: 'Progresso registado com sucesso',
    error: 'Erro ao registar progresso',
  },
  'orders/create': {
    success: 'Ordem de produção criada',
    error: 'Erro ao criar ordem',
  },
  'materials/createPedido': {
    success: 'Pedido de material enviado',
    error: 'Erro ao enviar pedido',
  },
  'materials/responderPedido': {
    success: 'Pedido respondido com sucesso',
    error: 'Erro ao responder pedido',
  },
  'materials/registarMovimento': {
    success: 'Movimento de stock registado',
    error: 'Erro ao registar movimento',
  },
};

export const toastMiddleware: Middleware = () => next => action => {
  const result = next(action);

  const type = (action as any).type as string;

  if (type.endsWith('/fulfilled')) {
    const key = type.replace('/fulfilled', '');
    const msg = MESSAGES[key];
    if (msg?.success) {
      toast.success(msg.success);
    }
  }

  if (type.endsWith('/rejected')) {
    const key = type.replace('/rejected', '');
    const msg = MESSAGES[key];
    const errorMsg = (action as any).payload as string | undefined;
    if (msg?.error || errorMsg) {
      toast.error(errorMsg ?? msg?.error ?? 'Ocorreu um erro');
    }
  }

  return result;
};
