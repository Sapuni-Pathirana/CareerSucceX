import { apiClient } from './client';
import type {
  QuizQuestion,
  StartVerificationResponse,
  VerificationBadge,
  VerificationHistoryItem,
  VerificationSubmitResponse,
} from '../types';

function toSubmitAnswers(questions: QuizQuestion[], answers: Record<string, string>) {
  return questions.map((q) => {
    const answer = answers[q.id] ?? '';
    const selectedIndex = q.options?.findIndex((opt) => opt === answer) ?? -1;
    return {
      questionId: q.id,
      id: q.id,
      answer,
      selectedOption: answer,
      ...(selectedIndex >= 0 ? { selectedIndex } : {}),
    };
  });
}

export const verificationsApi = {
  start: (skillId: string) =>
    apiClient
      .post<StartVerificationResponse>('/verifications/start', { skillId })
      .then((r) => r.data),

  submit: (id: string, questions: QuizQuestion[], answers: Record<string, string>) =>
    apiClient
      .post<VerificationSubmitResponse>(`/verifications/${id}/submit`, {
        answers: toSubmitAnswers(questions, answers),
      })
      .then((r) => r.data),

  getHistory: () =>
    apiClient.get<VerificationHistoryItem[]>('/verifications/history').then((r) => r.data),

  getBadges: () =>
    apiClient.get<VerificationBadge[]>('/verifications/badges').then((r) => r.data),
};
