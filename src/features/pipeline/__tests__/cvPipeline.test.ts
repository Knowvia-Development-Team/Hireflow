import { describe, it, expect, vi, beforeEach } from 'vitest';
import { triggerCVPipeline, pipelineBus, _resetPipelineState } from '../services/cvPipeline';
import { useToastStore }                  from '@/shared/stores/toastStore';
import { INITIAL_JOBS }                   from '@/data';
import type { CVUploadEvent, Candidate }  from '@/types';

// Silence analysis service network errors in tests
vi.mock('@/features/ai-analysis/services/analysisService', () => ({
  analysisService: {
    extract:   vi.fn().mockRejectedValue(new Error('HF not available in test')),
    match:     vi.fn().mockRejectedValue(new Error('HF not available in test')),
    sentiment: vi.fn().mockRejectedValue(new Error('HF not available in test')),
  },
}));

const MOCK_EVENT: CVUploadEvent = {
  candidateId: 'Test Candidate',
  jobId:       'job-001',
  fileKey:     'cv-test-001.txt',
  fileName:    'test-cv.txt',
  uploadedAt:  '2026-03-23T09:00:00Z',
};

const MOCK_JOB = INITIAL_JOBS[0]!;

/** Wait for the pipeline to call onComplete (real timers — pipeline uses setTimeout) */
async function waitForPipeline(
  event: CVUploadEvent,
  cvText: string,
  timeoutMs = 5000,
): Promise<Candidate> {
  return new Promise<Candidate>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Pipeline timeout')), timeoutMs);
    triggerCVPipeline(event, cvText, MOCK_JOB, (candidate) => {
      clearTimeout(timer);
      resolve(candidate);
    });
  });
}

describe('CV Pipeline', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
    _resetPipelineState();   // reset module-level processing flag between tests
  });

  it('triggerCVPipeline is non-blocking (returns void immediately)', () => {
    const result = triggerCVPipeline(MOCK_EVENT, 'cv text', MOCK_JOB, vi.fn());
    expect(result).toBeUndefined();
  });

  it('calls onComplete with a candidate after processing', async () => {
    const candidate = await waitForPipeline(MOCK_EVENT, 'cv text');
    expect(candidate).toHaveProperty('id');
    expect(candidate).toHaveProperty('name');
    expect(candidate).toHaveProperty('score');
  }, 8000);

  it('produced candidate stage is Applied', async () => {
    const candidate = await waitForPipeline(MOCK_EVENT, 'cv');
    expect(candidate.stage).toBe('Applied');
    expect(candidate.stageKey).toBe('Applied');
  }, 8000);

  it('produced candidate source is CV Upload', async () => {
    const candidate = await waitForPipeline(MOCK_EVENT, 'cv');
    expect(candidate.source).toBe('CV Upload');
  }, 8000);

  it('score is in range [0, 100]', async () => {
    const candidate = await waitForPipeline(MOCK_EVENT, 'cv');
    expect(candidate.score).toBeGreaterThanOrEqual(0);
    expect(candidate.score).toBeLessThanOrEqual(100);
  }, 8000);

  it('assigns job title as candidate role', async () => {
    const candidate = await waitForPipeline(MOCK_EVENT, 'cv');
    expect(candidate.role).toBe(MOCK_JOB.title);
  }, 8000);

  it('emits CANDIDATE_NEW on pipelineBus', async () => {
    const busHandler = vi.fn();
    pipelineBus.addEventListener('CANDIDATE_NEW', busHandler);
    await waitForPipeline({ ...MOCK_EVENT, candidateId: 'Bus Test' }, 'cv');
    expect(busHandler).toHaveBeenCalledOnce();
    pipelineBus.removeEventListener('CANDIDATE_NEW', busHandler);
  }, 8000);

  it('shows success toast after completing', async () => {
    await waitForPipeline({ ...MOCK_EVENT, candidateId: 'Toast Test' }, 'cv');
    const { toasts } = useToastStore.getState();
    expect(toasts.some(t => t.title === 'New Candidate')).toBe(true);
  }, 8000);

  it('generates a 1-2 character initials string', async () => {
    const candidate = await waitForPipeline(MOCK_EVENT, 'cv');
    expect(candidate.initials).toMatch(/^[A-Z]{1,2}$/i);
  }, 8000);
});
