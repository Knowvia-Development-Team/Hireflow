import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(()  => { vi.useRealTimers(); });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('does NOT update within the delay period', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );
    rerender({ value: 'ab' });
    vi.advanceTimersByTime(200);
    expect(result.current).toBe('a'); // still old value
  });

  it('updates after the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );
    rerender({ value: 'ab' });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('ab');
  });

  it('resets the timer on every new value (debounce behaviour)', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebounce(value, 300),
      { initialProps: { value: 'a' } },
    );
    rerender({ value: 'ab' });
    vi.advanceTimersByTime(200);
    rerender({ value: 'abc' }); // resets timer
    vi.advanceTimersByTime(200); // only 200ms since last change
    expect(result.current).toBe('a'); // still original
    act(() => { vi.advanceTimersByTime(100); }); // now 300ms since 'abc'
    expect(result.current).toBe('abc');
  });

  it('works with numbers', () => {
    const { result, rerender } = renderHook(
      ({ value }: { value: number }) => useDebounce(value, 500),
      { initialProps: { value: 1 } },
    );
    rerender({ value: 42 });
    act(() => { vi.advanceTimersByTime(500); });
    expect(result.current).toBe(42);
  });

  it('cleans up the timeout on unmount', () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = renderHook(() => useDebounce('test', 300));
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
