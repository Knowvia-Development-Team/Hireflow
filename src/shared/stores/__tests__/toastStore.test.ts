import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore, toast } from '../toastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useToastStore.setState({ toasts: [] });
    vi.useFakeTimers();
  });

  afterEach(() => { vi.useRealTimers(); });

  it('adds a toast with correct fields', () => {
    useToastStore.getState().addToast('Test Title', 'Test message', 'green');
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.title).toBe('Test Title');
    expect(toasts[0]?.msg).toBe('Test message');
    expect(toasts[0]?.color).toBe('green');
    expect(toasts[0]?.leaving).toBe(false);
  });

  it('defaults to blue color', () => {
    useToastStore.getState().addToast('Hello', 'World');
    expect(useToastStore.getState().toasts[0]?.color).toBe('blue');
  });

  it('marks toast as leaving after 3.5s', () => {
    useToastStore.getState().addToast('Temp', 'msg');
    vi.advanceTimersByTime(3500);
    expect(useToastStore.getState().toasts[0]?.leaving).toBe(true);
  });

  it('removes toast after 3.8s', () => {
    useToastStore.getState().addToast('Temp', 'msg');
    vi.advanceTimersByTime(3800);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('removeToast removes only the specified toast', () => {
    const { addToast, removeToast } = useToastStore.getState();
    addToast('First', '');
    addToast('Second', '');
    const id = useToastStore.getState().toasts[0]!.id;
    removeToast(id);
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0]?.title).toBe('Second');
  });

  it('can hold multiple toasts simultaneously', () => {
    const { addToast } = useToastStore.getState();
    addToast('A', ''); addToast('B', ''); addToast('C', '');
    expect(useToastStore.getState().toasts).toHaveLength(3);
  });
});

describe('imperative toast helper', () => {
  beforeEach(() => { useToastStore.setState({ toasts: [] }); });

  it('toast.success adds a green toast', () => {
    toast.success('Done!');
    expect(useToastStore.getState().toasts[0]?.color).toBe('green');
  });

  it('toast.info adds a blue toast', () => {
    toast.info('Note');
    expect(useToastStore.getState().toasts[0]?.color).toBe('blue');
  });

  it('toast.warning adds an amber toast', () => {
    toast.warning('Watch out');
    expect(useToastStore.getState().toasts[0]?.color).toBe('amber');
  });
});
