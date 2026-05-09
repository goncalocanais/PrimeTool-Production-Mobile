import axios, {AxiosInstance, InternalAxiosRequestConfig, AxiosResponse} from 'axios';
import {storage} from '../utils/storage';
import {store} from '../store';
import {logout} from '../store/slices/authSlice';

// Substituir pelo URL real da API quando disponível
export const API_BASE_URL = 'https://api.primetool.pt/api/v1';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Request interceptor — adiciona o token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const token = await storage.getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    error => Promise.reject(error),
  );

  // Response interceptor — trata erros globais
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async error => {
      if (error.response?.status === 401) {
        store.dispatch(logout());
      }
      return Promise.reject(error);
    },
  );

  return client;
};

export const apiClient = createApiClient();
