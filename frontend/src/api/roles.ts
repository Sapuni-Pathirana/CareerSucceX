import { apiClient } from './client';
import type { TargetRole } from '../types';

export const rolesApi = {
  list: () => apiClient.get<TargetRole[]>('/roles').then((r) => r.data),

  get: (id: string) => apiClient.get<TargetRole>(`/roles/${id}`).then((r) => r.data),
};
