import { apiClient } from './client';
import type { ItemStatus, Roadmap, RoadmapItem } from '../types';

export const roadmapsApi = {
  generate: (targetRoleId: string) =>
    apiClient.post<Roadmap>('/roadmaps/generate', { targetRoleId }).then((r) => r.data),

  getActive: () => apiClient.get<Roadmap>('/roadmaps/active').then((r) => r.data),

  updateItemStatus: (itemId: string, status: ItemStatus) =>
    apiClient.patch<RoadmapItem>(`/roadmaps/items/${itemId}`, { status }).then((r) => r.data),

  getHistory: () => apiClient.get<Roadmap[]>('/roadmaps/history').then((r) => r.data),
};
