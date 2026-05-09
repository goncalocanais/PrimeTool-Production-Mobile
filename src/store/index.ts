import {configureStore} from '@reduxjs/toolkit';
import {useDispatch, useSelector, TypedUseSelectorHook} from 'react-redux';
import authReducer from './slices/authSlice';
import ordersReducer from './slices/ordersSlice';
import materialsReducer from './slices/materialsSlice';
import offlineReducer from './slices/offlineSlice';
import {toastMiddleware} from './middleware/toastMiddleware';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
    materials: materialsReducer,
    offline: offlineReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(toastMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
