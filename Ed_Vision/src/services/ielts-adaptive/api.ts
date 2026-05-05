import apiClient from '@/services/api/apiClient';

const API_PREFIX = '/ielts-adaptive';

export const ieltsAdaptiveApi = {
  getMyRoadmap: async (accountId?: number) => {
    const response = await apiClient.get(`${API_PREFIX}/me/roadmap`, {
      params: accountId ? { accountId } : undefined,
    });
    return response.data;
  },

  generateMyRoadmap: async (payload: any, accountId?: number) => {
    const response = await apiClient.post(
      `${API_PREFIX}/me/roadmap/generate`,
      payload,
      {
        params: accountId ? { accountId } : undefined,
      },
    );
    return response.data;
  },

  updateMyTargets: async (
    payload: { target_band?: number; current_band?: number; target_completion_date?: string },
    accountId?: number,
  ) => {
    const response = await apiClient.patch(`${API_PREFIX}/me/targets`, payload, {
      params: accountId ? { accountId } : undefined,
    });
    return response.data;
  },

  getLesson: async (lessonId: number) => {
    const response = await apiClient.get(`${API_PREFIX}/lessons/${lessonId}`);
    return response.data;
  },

  submitPractice: async (payload: any) => {
    const response = await apiClient.post(`${API_PREFIX}/practice/submit`, payload);
    return response.data;
  },

  createBandTest: async (payload: any, accountId?: number) => {
    const response = await apiClient.post(`${API_PREFIX}/band-tests`, payload, {
      params: accountId ? { accountId } : undefined,
    });
    return response.data;
  },

  submitBandTest: async (payload: any) => {
    const response = await apiClient.post(`${API_PREFIX}/band-tests/submit`, payload);
    return response.data;
  },

  applyBandTest: async (testId: string) => {
    const response = await apiClient.post(`${API_PREFIX}/band-tests/${testId}/apply`);
    return response.data as { applied: boolean; new_band: number; band_change: string; roadmap_regenerated: boolean };
  },

  getMyProgress: async (accountId?: number) => {
    const response = await apiClient.get(`${API_PREFIX}/me/progress`, {
      params: accountId ? { accountId } : undefined,
    });
    return response.data;
  },

  getLearningAnalysis: async (accountId?: number) => {
    const response = await apiClient.get(`${API_PREFIX}/me/learning-analysis`, {
      params: accountId ? { accountId } : undefined,
    });
    return response.data;
  },

  // Legacy compatibility helpers
  getRoadmap: async (enrollmentId: number) => {
    const response = await apiClient.get(
      `${API_PREFIX}/roadmap/enrollment/${enrollmentId}`,
    );
    return response.data;
  },

  unlockNextLesson: async (roadmapId: number) => {
    await apiClient.post(`${API_PREFIX}/roadmap/${roadmapId}/unlock-next`);
  },

  completeLesson: async (lessonId: number) => {
    await apiClient.post(`${API_PREFIX}/lesson/${lessonId}/complete`);
  },

  getBandTest: async (testId: string) => {
    const response = await apiClient.get(`${API_PREFIX}/band-test/${testId}`);
    return response.data;
  },

  getSkillProgress: async (enrollmentId: number) => {
    const response = await apiClient.get(
      `${API_PREFIX}/progress/enrollment/${enrollmentId}`,
    );
    return response.data;
  },

  gradeSpeaking: async (payload: {
    transcript: string;
    item_prompt: string;
    target_band: number;
    part_type?: string;
    lesson_id?: number;
  }) => {
    const response = await apiClient.post(`${API_PREFIX}/grade/speaking`, payload);
    return response.data;
  },

  gradeWriting: async (payload: {
    essay: string;
    task_prompt: string;
    task_type: 'task1' | 'task2';
    target_band: number;
    word_count?: number;
    lesson_id?: number;
  }) => {
    const response = await apiClient.post(`${API_PREFIX}/grade/writing`, payload);
    return response.data;
  },
};

export default ieltsAdaptiveApi;
