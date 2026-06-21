import { apiClient } from './client';
import type { SelfAssessmentItem, Skill, SkillGap, UserSkill } from '../types';

type PagedSkills = {
  content?: Skill[];
  last?: boolean;
  totalPages?: number;
};

export const skillsApi = {
  getTaxonomy: async (params?: { category?: string; search?: string }) => {
    const all: Skill[] = [];
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const { data } = await apiClient.get<PagedSkills | Skill[]>('/skills/taxonomy', {
        params: { ...params, page, size: 100 },
      });

      if (Array.isArray(data)) {
        return data;
      }

      all.push(...(data.content ?? []));
      hasMore = data.last === false || (data.totalPages != null && page + 1 < data.totalPages);
      page += 1;
      if (page > 20) break;
    }

    return all;
  },

  getMine: () => apiClient.get<UserSkill[]>('/skills/mine').then((r) => r.data),

  updateSelfAssessment: (items: SelfAssessmentItem[]) =>
    apiClient.put('/skills/self-assessment', items).then((r) => r.data),

  getGaps: (targetRoleId?: string) =>
    apiClient
      .get<SkillGap[]>('/skills/gaps', { params: { targetRoleId } })
      .then((r) => r.data),

  recalculateGaps: (targetRoleId: string) =>
    apiClient
      .post<SkillGap[]>('/skills/gaps/recalculate', null, { params: { targetRoleId } })
      .then((r) => r.data),
};
