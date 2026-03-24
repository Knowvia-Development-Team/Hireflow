import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { INITIAL_JOBS } from '@/data';
import { toast }        from '@/shared/stores/toastStore';
import type { Job, NewJobFormData } from '@/types';

export const jobKeys = {
  all:  ['jobs']          as const,
  list: () => ['jobs', 'list'] as const,
};

export function useJobs() {
  return useQuery({
    queryKey: jobKeys.list(),
    queryFn:  () => Promise.resolve(INITIAL_JOBS), // swap for jobService.list()
    staleTime: 2 * 60 * 1000,
  });
}

export function usePublishJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      Promise.resolve({ id } as unknown as Job), // swap for jobService.publish(id)

    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: jobKeys.all });
      const prev = qc.getQueryData<Job[]>(jobKeys.list());
      qc.setQueryData<Job[]>(jobKeys.list(),
        old => old?.map(j => j.id === id ? { ...j, status: 'Open' } : j) ?? []);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(jobKeys.list(), ctx.prev);
      toast.warning('Publish failed', 'Changes have been reverted.');
    },
    onSuccess: () => {
      toast.success('Job Published', 'The role is now live.');
      void qc.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NewJobFormData): Promise<Job> => {
      const newJob: Job = {
        id: 'job-' + Date.now().toString(36),
        title: data.title || 'New Job',
        dept: data.dept,
        type: 'Full-time',
        location: data.location,
        status: 'Open',
        applicants: 0,
        salary: 'Competitive',
        skills: data.skills ?? '',
        desc: data.desc ?? '',
        created: 'Today',
      };
      return Promise.resolve(newJob);
    },
    onSuccess: (newJob) => {
      qc.setQueryData<Job[]>(jobKeys.list(),
        old => [newJob, ...(old ?? [])]);
      toast.success('Job Published', `${newJob.title} is now live.`);
    },
    onError: () => toast.warning('Failed to create job', ''),
  });
}
