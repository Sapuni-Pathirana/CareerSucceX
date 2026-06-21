import { apiClient } from './client';
import type { AuthResponse, User } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  logout: () => apiClient.post('/auth/logout'),

  me: () => apiClient.get<User>('/auth/me').then((r) => r.data),
};
