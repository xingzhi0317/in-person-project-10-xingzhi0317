import { useState, useCallback, useRef } from 'react';

/**
 * TODO: Implement useSearch hook
 *
 * Requirements:
 * 1. Debounce search input to reduce API calls
 * 2. Cancel in-flight requests when new search starts
 * 3. Prevent race conditions with AbortController
 * 4. Provide loading, error, and results states
 *
 * @param {Function} searchFn - The search function to call
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {object} - { results, loading, error, search, cancel }
 */
export function useSearch(searchFn, delay = 500) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);

  const search = useCallback((query) => {
    // A new keystroke: drop the timer and the request of the previous one
    clearTimeout(timeoutRef.current);
    abortControllerRef.current?.abort();

    if (!query) {
      setResults(null);
      setLoading(false);
      return;
    }

    // Debounce: wait until the typing pauses for `delay` ms
    timeoutRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const data = await searchFn(query, controller.signal);
        if (!controller.signal.aborted) {
          setResults(data);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setResults(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, delay);
  }, [searchFn, delay]);

  const cancel = useCallback(() => {
    clearTimeout(timeoutRef.current);
    abortControllerRef.current?.abort();
    setLoading(false);
  }, []);

  return { results, loading, error, search, cancel };
}