import { useState, useCallback } from 'react';

/**
 * Type-safe localStorage hook with JSON serialisation.
 * Falls back to initialValue if read/write fails (e.g. private browsing).
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (v: T) => void, () => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStored(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silently fail in private mode / storage full
    }
  }, [key]);

  const remove = useCallback(() => {
    try {
      setStored(initialValue);
      window.localStorage.removeItem(key);
    } catch { /* noop */ }
  }, [key, initialValue]);

  return [stored, setValue, remove];
}
