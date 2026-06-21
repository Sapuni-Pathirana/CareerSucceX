import { apiClient } from './client';
import type { ReadinessHistoryPoint, ReadinessScore } from '../types';

export const readinessApi = {
  getScore: () => apiClient.get<ReadinessScore>('/readiness/score').then((r) => r.data),

  getHistory: () =>
    apiClient.get<ReadinessHistoryPoint[]>('/readiness/history').then((r) => r.data),

  getRecommendations: () =>
    apiClient.get<string[]>('/readiness/recommendations').then((r) => r.data),
};
