import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../redux/store';
import { clearAuth } from '../redux/authSlice';
import { Alert } from 'react-native';
import Constants from 'expo-constants';

// API_BASE_URL from app.json extra config
// Fallback to hardcoded IP if not configured
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://192.168.2.127:5121';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add token to requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors and token refresh
apiClient.interceptors.response.use(
  async (response) => {
    // Check if backend sent a new token (auto-refresh)
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      await AsyncStorage.setItem('token', newToken);
      console.log('🔄 Token auto-refreshed');
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // Check if token is expired
      const tokenExpired = error.response?.headers['token-expired'];
      
      // Dispatch Redux action to clear auth state
      store.dispatch(clearAuth());
      
      // Clear all auth data from storage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Show alert before navigation
      if (tokenExpired === 'true') {
        console.log('🔒 Token expired - redirecting to login');
        Alert.alert(
          'เซสชันหมดอายุ',
          'กรุณาเข้าสู่ระบบใหม่',
          [{ text: 'ตกลง' }]
        );
      } else {
        console.log('🔒 Unauthorized - redirecting to login');
        Alert.alert(
          'ไม่มีสิทธิ์เข้าถึง',
          'กรุณาเข้าสู่ระบบใหม่',
          [{ text: 'ตกลง' }]
        );
      }
      
      // Note: Navigation should be handled by the app after clearing auth
    }
    return Promise.reject(error);
  }
);

export default apiClient;
