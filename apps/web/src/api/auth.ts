import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'USER';
  authProvider: 'LOCAL' | 'OIDC';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface SetupDto {
  email: string;
  username: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
}

export const authApi = {
  async getSetupStatus(): Promise<{ setupComplete: boolean }> {
    const { data } = await apiClient.get('/auth/setup/status');
    return data;
  },

  async setup(dto: SetupDto): Promise<AuthResponse> {
    const { data } = await apiClient.post('/auth/setup', dto);
    return data;
  },

  async login(dto: LoginDto): Promise<AuthResponse> {
    const { data } = await apiClient.post('/auth/login', dto);
    return data;
  },

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const { data } = await apiClient.post('/auth/register', dto);
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },

  async getOAuthConfig(): Promise<{ enabled: boolean }> {
    const { data } = await apiClient.get('/auth/oauth/config');
    return data;
  },

  getOAuthLoginUrl(): string {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    return `${apiUrl}/auth/oauth/login`;
  },
};
