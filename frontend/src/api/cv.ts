import { apiClient } from './client';
import type { AnalyzeJobResponse, CvAnalysis, CvDocument } from '../types';

export const cvApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post<{ documentId: string }>('/cv/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  listDocuments: () =>
    apiClient.get<CvDocument[]>('/cv/documents').then((r) => r.data),

  analyze: (documentId: string, targetRoleId?: string) =>
    apiClient
      .post<AnalyzeJobResponse>('/cv/analyze', { documentId, targetRoleId })
      .then((r) => r.data),

  getAnalysis: (id: string) =>
    apiClient.get<CvAnalysis>(`/cv/analyses/${id}`).then((r) => r.data),

  listAnalyses: () =>
    apiClient.get<CvAnalysis[]>('/cv/analyses').then((r) => r.data),

  deleteDocument: (id: string) => apiClient.delete(`/cv/documents/${id}`),
};
