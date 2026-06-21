import { apiClient } from './client';
import type { InterviewSession, StartSessionRequest, SubmitAnswerRequest } from '../types';

export const interviewsApi = {
  startSession: (data: StartSessionRequest) =>
    apiClient.post<InterviewSession>('/interviews/sessions', data).then((r) => r.data),

  getSession: (id: string) =>
    apiClient.get<InterviewSession>(`/interviews/sessions/${id}`).then((r) => r.data),

  submitAnswer: (sessionId: string, data: SubmitAnswerRequest) =>
    apiClient
      .post<InterviewSession>(`/interviews/sessions/${sessionId}/answers`, data)
      .then((r) => r.data),

  completeSession: (id: string) =>
    apiClient
      .post<InterviewSession>(`/interviews/sessions/${id}/complete`)
      .then((r) => r.data),

  listSessions: () =>
    apiClient.get<InterviewSession[]>('/interviews/sessions').then((r) => r.data),
};
