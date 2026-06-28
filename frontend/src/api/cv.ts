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

  analyze: (documentId: string) =>
    apiClient
      .post<AnalyzeJobResponse>('/cv/analyze', { documentId })
      .then((r) => r.data),

  getAnalysis: (id: string) =>
    apiClient.get<CvAnalysis>(`/cv/analyses/${id}`).then((r) => r.data),

  listAnalyses: () =>
    apiClient.get<CvAnalysis[]>('/cv/analyses').then((r) => r.data),

  deleteDocument: (id: string) => apiClient.delete(`/cv/documents/${id}`),

  fetchDocument: async (id: string) => {
    const response = await apiClient.get(`/cv/documents/${id}/download`, {
      responseType: 'blob',
    });

    const contentType = String(response.headers['content-type'] ?? 'application/octet-stream');

    if (response.status >= 400 || contentType.includes('application/json')) {
      let message = `Failed to load document (${response.status})`;
      try {
        const text = await (response.data as Blob).text();
        const parsed = JSON.parse(text) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        // keep default message
      }
      throw new Error(message);
    }

    if (!(response.data instanceof Blob) || response.data.size === 0) {
      throw new Error('Document file is empty or unavailable.');
    }

    let fileName = 'cv-document';
    const disposition = response.headers['content-disposition'] as string | undefined;
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/i);
      if (match?.[1]) fileName = match[1];
    }

    return {
      blob: response.data,
      contentType,
      fileName,
      url: URL.createObjectURL(response.data),
    };
  },
};
