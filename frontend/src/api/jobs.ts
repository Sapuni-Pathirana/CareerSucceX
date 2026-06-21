import { apiClient } from './client';
import type { JobStatusResponse } from '../types';

export const jobsApi = {
  getStatus: (id: string) =>
    apiClient.get<JobStatusResponse>(`/jobs/${id}`).then((r) => r.data),

  pollUntilComplete: async (
    jobId: string,
    onProgress?: (status: JobStatusResponse) => void,
    intervalMs = 2000,
    maxAttempts = 60,
  ): Promise<JobStatusResponse> => {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await jobsApi.getStatus(jobId);
      onProgress?.(status);
      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        return status;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error('Job polling timed out');
  },
};
