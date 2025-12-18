import apiClient from './client';
import type { User } from '../redux/authSlice';

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  userName: string;
  fullName: string;
  role: 'admin' | 'staff';
  token: string;
}

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<User>('/api/auth/me');
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/auth/logout');
  },

  changePassword: async (data: { oldPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.post('/api/auth/change-password', data);
  },
};

export default authAPI;
