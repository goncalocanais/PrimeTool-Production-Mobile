import {useEffect} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {useAppDispatch, useAppSelector} from '../store';
import {setConnected} from '../store/slices/offlineSlice';
import {offlineQueue} from '../utils/offlineQueue';
import {toast} from '../utils/toast';

/**
 * Hook que gere a deteção de rede e sincronização automática da fila offline.
 * Usar no componente raiz (já usado em RootNavigator).
 */
export const useNetworkSync = () => {
  const dispatch = useAppDispatch();
  const {isConnected, queue} = useAppSelector(s => s.offline);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? false;
      const wasOffline = !isConnected;

      dispatch(setConnected(connected));

      if (connected && wasOffline) {
        if (queue.length > 0) {
          toast.info(`A sincronizar ${queue.length} ação(ões) pendente(s)...`, 'A recuperar ligação');
          offlineQueue.sync();
        }
      }

      if (!connected && isConnected) {
        toast.offline();
      }
    });

    return unsubscribe;
  }, [dispatch, isConnected, queue.length]);

  return {isConnected, pendingActions: queue.length};
};
