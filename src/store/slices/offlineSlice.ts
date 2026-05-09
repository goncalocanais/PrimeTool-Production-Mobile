import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {OfflineAction} from '../../types';

interface OfflineState {
  isConnected: boolean;
  queue: OfflineAction[];
  isSyncing: boolean;
}

const initialState: OfflineState = {
  isConnected: true,
  queue: [],
  isSyncing: false,
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setConnected(state, action: PayloadAction<boolean>) {
      state.isConnected = action.payload;
    },
    addToQueue(state, action: PayloadAction<OfflineAction>) {
      state.queue.push(action.payload);
    },
    removeFromQueue(state, action: PayloadAction<string>) {
      state.queue = state.queue.filter(item => item.id !== action.payload);
    },
    clearQueue(state) {
      state.queue = [];
    },
    setSyncing(state, action: PayloadAction<boolean>) {
      state.isSyncing = action.payload;
    },
    incrementRetry(state, action: PayloadAction<string>) {
      const item = state.queue.find(q => q.id === action.payload);
      if (item) {
        item.retries += 1;
      }
    },
  },
});

export const {setConnected, addToQueue, removeFromQueue, clearQueue, setSyncing, incrementRetry} =
  offlineSlice.actions;
export default offlineSlice.reducer;
