import axios from 'axios';
import { store } from '../redux/store';
import { clearAuth } from '../redux/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Check if backend sent a new token (auto-refresh)
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      localStorage.setItem('token', newToken);
      console.log('🔄 Token auto-refreshed');
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Check if token is expired
      const tokenExpired = error.response?.headers['token-expired'];
      
      // Dispatch Redux action to clear auth state
      store.dispatch(clearAuth());
      
      // Clear all auth data from storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Show alert before redirect
      if (tokenExpired === 'true') {
        console.log('🔒 Token expired - redirecting to login');
        alert('เซสชันหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่');
      } else {
        console.log('🔒 Unauthorized - redirecting to login');
        alert('กรุณาเข้าสู่ระบบใหม่');
      }
      
      // Redirect to login immediately
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
