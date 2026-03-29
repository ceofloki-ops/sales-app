import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

interface User {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const { access_token, user } = response.data;

      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));

      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      set({ token: access_token, user, isLoading: false });
      return true;
    } catch (error: any) {
      const message = error?.response?.data?.detail || 'Error al iniciar sesión';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    delete axios.defaults.headers.common['Authorization'];
    set({ token: null, user: null });
  },

  loadStoredAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('auth_user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({ token, user });
      }
    } catch {
      // ignore
    }
  },
}));
