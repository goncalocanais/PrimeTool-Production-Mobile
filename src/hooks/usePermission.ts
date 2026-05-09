import {useAppSelector} from '../store';
import {UserRole} from '../types';

/**
 * Hook central de controlo de permissões.
 * Uso: const { can, role, isArmazem } = usePermission();
 */
export const usePermission = () => {
  const user = useAppSelector(s => s.auth.user);
  const role = (user?.perfil ?? 'producao') as UserRole;

  const can = (...roles: UserRole[]): boolean => roles.includes(role);

  return {
    role,
    user,

    // Helpers booleanos por perfil
    isDirecao: role === 'direcao',
    isRH: role === 'rh',
    isPlaneamento: role === 'planeamento',
    isArmazem: role === 'armazem',
    isProducao: role === 'producao',
    isQualidade: role === 'qualidade',
    isExpedicao: role === 'expedicao',
    isMontagem: role === 'montagem',

    // Helper genérico
    can,

    // Permissões específicas de negócio
    canCreateOP: can('planeamento', 'direcao'),
    canAdvanceOP: (opStatus: string) => {
      const map: Record<string, UserRole[]> = {
        planeamento: ['planeamento', 'direcao'],
        em_producao: ['producao', 'direcao'],
        qualidade: ['qualidade', 'direcao'],
        expedicao: ['expedicao', 'direcao'],
        montagem: ['montagem', 'direcao'],
      };
      return (map[opStatus] ?? []).includes(role);
    },
    canManageStock: can('armazem', 'direcao'),
    canResponderPedidoMaterial: can('armazem', 'direcao'),
    canCreatePedidoMaterial: can('producao', 'armazem', 'direcao'),
    canCreatePedidoCompra: can('armazem', 'direcao'),
    canManageQualidade: can('qualidade', 'direcao'),
    canManageExpedicao: can('expedicao', 'direcao'),
    canManageRH: can('rh', 'direcao'),
    canViewAllOPs: can('direcao', 'planeamento', 'qualidade', 'expedicao'),
    canRegisterProgress: can('producao', 'direcao'),
    canRequestAssistance: can('producao'),
    canRespondAssistance: can('planeamento', 'direcao'),
  };
};
