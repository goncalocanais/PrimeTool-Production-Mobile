import {store} from '../store';
import {addToQueue, removeFromQueue, setSyncing, incrementRetry} from '../store/slices/offlineSlice';
import {storage} from './storage';
import {apiClient} from '../api/client';
import {OfflineAction} from '../types';

const MAX_RETRIES = 3;

export const offlineQueue = {
  async add(type: string, method: string, url: string, data?: any) {
    const action: OfflineAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      payload: {method, url, data},
      timestamp: Date.now(),
      retries: 0,
    };
    store.dispatch(addToQueue(action));
    const currentQueue = await storage.getOfflineQueue();
    await storage.saveOfflineQueue([...currentQueue, action]);
  },

  async sync() {
    const state = store.getState();
    if (!state.offline.isConnected || state.offline.isSyncing) return;

    const queue = [...state.offline.queue];
    if (queue.length === 0) return;

    store.dispatch(setSyncing(true));

    for (const action of queue) {
      if (action.retries >= MAX_RETRIES) {
        store.dispatch(removeFromQueue(action.id));
        continue;
      }

      try {
        const {method, url, data} = action.payload;
        await apiClient.request({method, url, data});
        store.dispatch(removeFromQueue(action.id));
        const currentQueue = await storage.getOfflineQueue();
        await storage.saveOfflineQueue(currentQueue.filter(q => q.id !== action.id));
      } catch {
        store.dispatch(incrementRetry(action.id));
      }
    }

    store.dispatch(setSyncing(false));
  },

  async loadFromStorage() {
    const queue = await storage.getOfflineQueue();
    queue.forEach(action => store.dispatch(addToQueue(action)));
  },
};
