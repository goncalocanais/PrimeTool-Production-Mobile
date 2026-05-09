import AsyncStorage from '@react-native-async-storage/async-storage';
import {User, OfflineAction} from '../types';

const KEYS = {
  TOKEN: '@primetool:token',
  USER: '@primetool:user',
  OFFLINE_QUEUE: '@primetool:offline_queue',
};

export const storage = {
  async setToken(token: string) {
    await AsyncStorage.setItem(KEYS.TOKEN, token);
  },
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.TOKEN);
  },
  async setUser(user: User) {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },
  async getUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },
  async clearAll() {
    await AsyncStorage.removeItem(KEYS.TOKEN);
    await AsyncStorage.removeItem(KEYS.USER);
  },
  async getOfflineQueue(): Promise<OfflineAction[]> {
    const raw = await AsyncStorage.getItem(KEYS.OFFLINE_QUEUE);
    return raw ? JSON.parse(raw) : [];
  },
  async saveOfflineQueue(queue: OfflineAction[]) {
    await AsyncStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  },
};
