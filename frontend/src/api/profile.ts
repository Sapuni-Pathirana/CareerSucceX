import { apiClient } from './client';
import type { DashboardResponse, Profile, UpdateProfileRequest } from '../types';

export const profileApi = {
  get: () => apiClient.get<Profile>('/profile').then((r) => r.data),

  update: (data: UpdateProfileRequest) =>
    apiClient.put<Profile>('/profile', data).then((r) => r.data),

  getDashboard: () =>
    apiClient.get<DashboardResponse>('/profile/dashboard').then((r) => r.data),
};
