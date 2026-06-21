import { apiClient } from './client';
import type { GitHubAnalysis, GitHubAnalyzeResponse, GitHubConnectionStatus } from '../types';

export const githubApi = {
  getStatus: () =>
    apiClient.get<GitHubConnectionStatus>('/github/status').then((r) => r.data),

  connect: async () => {
    const { data } = await apiClient.get<{ url: string }>('/github/connect');
    window.location.href = data.url;
  },

  analyze: () =>
    apiClient.post<GitHubAnalyzeResponse>('/github/analyze').then((r) => r.data),

  getLatestAnalysis: () =>
    apiClient.get<GitHubAnalysis>('/github/analyses/latest').then((r) => r.data),

  disconnect: () => apiClient.delete('/github/disconnect'),
};
