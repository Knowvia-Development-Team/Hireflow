import { get, post, put } from '@/shared/lib/api/client';
import type { Interview, NewInterviewFormData } from '@/types';

export const scheduleService = {
  list: (): Promise<Interview[]> => get('/interviews'),

  create: (data: NewInterviewFormData): Promise<Interview> =>
    post('/interviews', data),

  updateStatus: (id: number, status: Interview['status']): Promise<Interview> =>
    put(`/interviews/${id}/status`, { status }),

  cancel: (id: number): Promise<Interview> =>
    put(`/interviews/${id}/cancel`, {}),
};
