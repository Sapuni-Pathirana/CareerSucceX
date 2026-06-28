import axios from 'axios';
import { apiClient } from './client';
import type { GitHubAnalysis, GitHubAnalyzeResponse, GitHubConnectionStatus } from '../types';

async function fetchLatestAnalysis(): Promise<GitHubAnalysis[]> {
  try {
    const latest = await apiClient
      .get<GitHubAnalysis>('/github/analyses/latest')
      .then((r) => r.data);
    return [latest];
  } catch {
    return [];
  }
}

export const githubApi = {
  getStatus: () =>
    apiClient.get<GitHubConnectionStatus>('/github/status').then((r) => r.data),

  connect: async () => {
    const { data } = await apiClient.get<{ url: string }>('/github/connect');
    window.location.href = data.url;
  },

  analyze: () =>
    apiClient.post<GitHubAnalyzeResponse>('/github/analyze', {}).then((r) => r.data),

  listAnalyses: async () => {
    try {
      return await apiClient.get<GitHubAnalysis[]>('/github/analyses').then((r) => r.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        return fetchLatestAnalysis();
      }
      throw err;
    }
  },

  getLatestAnalysis: () =>
    apiClient.get<GitHubAnalysis>('/github/analyses/latest').then((r) => r.data),

  disconnect: () => apiClient.delete('/github/disconnect'),
};
