import apiClient from './client';

export interface LoginRequest {
  userName: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  password: string;
  fullName: string;
  role: string;
}

export interface LoginResponse {
  id: number;
  userName: string;
  fullName: string;
  role: string;
  token: string;
}

export interface User {
  id: number;
  userName: string | null;
  fullName: string | null;
  role: string | null;
  createdAt: string | null;
}

export const authAPI = {
  login: async (data: LoginRequest) => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await apiClient.post<User>('/api/auth/register', data);
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get<User>('/api/auth/me');
    return response.data;
  },

  logout: async () => {
    await apiClient.post('/api/auth/logout');
  },

  changePassword: async (oldPassword: string, newPassword: string) => {
    await apiClient.post('/api/auth/change-password', { oldPassword, newPassword });
  },
};

export interface Warehouse {
  id: number;
  whsName: string;
  createdAt: string | null;
}

export const warehouseAPI = {
  getAll: async () => {
    const response = await apiClient.get<Warehouse[]>('/api/warehouses');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<Warehouse>(`/api/warehouses/${id}`);
    return response.data;
  },

  create: async (whsName: string) => {
    const response = await apiClient.post<Warehouse>('/api/warehouses', { whsName });
    return response.data;
  },

  update: async (id: number, whsName: string) => {
    const response = await apiClient.put<Warehouse>(`/api/warehouses/${id}`, { whsName });
    return response.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/api/warehouses/${id}`);
  },
};

export interface Location {
  id: number;
  whsId: string;
  binLocation: string;
  createdAt: string | null;
}

export const locationAPI = {
  getAll: async (whsId?: string) => {
    const params = whsId ? { whsId } : {};
    const response = await apiClient.get<Location[]>('/api/locations', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<Location>(`/api/locations/${id}`);
    return response.data;
  },

  create: async (whsId: string, binLocation: string) => {
    const response = await apiClient.post<Location>('/api/locations', { whsId, binLocation });
    return response.data;
  },

  update: async (id: number, whsId: string, binLocation: string) => {
    const response = await apiClient.put<Location>(`/api/locations/${id}`, { whsId, binLocation });
    return response.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/api/locations/${id}`);
  },
};

export interface BinMapping {
  id: number;
  binId: number;
  sku: string;
  batchNo: string;
  userId: number;
  createdAt: string | null;
}

export const binMappingAPI = {
  getAll: async (binId?: number) => {
    const params = binId ? { binId } : {};
    const response = await apiClient.get<BinMapping[]>('/api/bin-mappings', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<BinMapping>(`/api/bin-mappings/${id}`);
    return response.data;
  },

  scan: async (binId: number, scannedData: string) => {
    const response = await apiClient.post<BinMapping>('/api/bin-mappings/scan', { binId, scannedData });
    return response.data;
  },

  create: async (binId: number, sku: string, batchNo: string) => {
    const response = await apiClient.post<BinMapping>('/api/bin-mappings', { binId, sku, batchNo });
    return response.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/api/bin-mappings/${id}`);
  },
};

export const userAPI = {
  getAll: async () => {
    const response = await apiClient.get<User[]>('/api/users');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await apiClient.get<User>(`/api/users/${id}`);
    return response.data;
  },

  create: async (userName: string, password: string, fullName: string, role: string) => {
    const response = await apiClient.post<User>('/api/users', { userName, password, fullName, role });
    return response.data;
  },

  update: async (id: number, fullName?: string, role?: string) => {
    const response = await apiClient.put<User>(`/api/users/${id}`, { fullName, role });
    return response.data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/api/users/${id}`);
  },

  resetPassword: async (id: number, newPassword: string) => {
    await apiClient.post(`/api/users/${id}/reset-password`, JSON.stringify(newPassword), {
      headers: { 'Content-Type': 'application/json' }
    });
  },
};
