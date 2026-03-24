import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns the initialValue when key is not set', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('persists value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('key1', ''));
    act(() => { result.current[1]('hello'); });
    expect(window.localStorage.getItem('key1')).toBe('"hello"');
  });

  it('reads existing localStorage value on mount', () => {
    window.localStorage.setItem('existing', JSON.stringify(42));
    const { result } = renderHook(() => useLocalStorage('existing', 0));
    expect(result.current[0]).toBe(42);
  });

  it('updates state when setter is called', () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    act(() => { result.current[1](99); });
    expect(result.current[0]).toBe(99);
  });

  it('remove() clears the key and resets to initialValue', () => {
    const { result } = renderHook(() => useLocalStorage('rm-key', 'init'));
    act(() => { result.current[1]('changed'); });
    expect(result.current[0]).toBe('changed');
    act(() => { result.current[2](); });
    expect(result.current[0]).toBe('init');
    expect(window.localStorage.getItem('rm-key')).toBeNull();
  });

  it('works with objects', () => {
    const { result } = renderHook(() => useLocalStorage<{ name: string }>('obj', { name: '' }));
    act(() => { result.current[1]({ name: 'Tino' }); });
    expect(result.current[0].name).toBe('Tino');
  });

  it('works with booleans', () => {
    const { result } = renderHook(() => useLocalStorage('dark', false));
    act(() => { result.current[1](true); });
    expect(result.current[0]).toBe(true);
  });

  it('does not throw when localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceeded'); });
    const { result } = renderHook(() => useLocalStorage('safe', 'fallback'));
    expect(() => act(() => { result.current[1]('new value'); })).not.toThrow();
  });

  it('handles corrupted JSON gracefully', () => {
    window.localStorage.setItem('bad-json', '{{invalid}}');
    const { result } = renderHook(() => useLocalStorage('bad-json', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });
});
