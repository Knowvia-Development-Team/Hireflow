import { useState, useEffect } from 'react';

/**
 * Debounce a rapidly-changing value.
 * Use for search inputs — prevents an API call on every keystroke.
 *
 * @example
 * const debouncedQuery = useDebounce(searchQuery, 300);
 * // debouncedQuery only updates 300ms after searchQuery stops changing
 */
export function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}
