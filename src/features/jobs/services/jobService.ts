import { get, post, put } from '@/shared/lib/api/client';
import type { Job, NewJobFormData } from '@/types';

export const jobService = {
  list: (): Promise<Job[]> => get('/jobs'),

  create: (data: NewJobFormData): Promise<Job> =>
    post('/jobs', data),

  publish: (id: string): Promise<Job> =>
    put(`/jobs/${id}/publish`, {}),

  pause: (id: string): Promise<Job> =>
    put(`/jobs/${id}/pause`, {}),
};
