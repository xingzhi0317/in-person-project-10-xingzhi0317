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

  // TODO: Add refs for abort controller and timeout

  const search = useCallback(async (query) => {
    // TODO: Implement debounced search with cancellation
    // For now, just call the search function directly
    setLoading(true);
    try {
      const data = await searchFn(query);
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchFn]);

  const cancel = useCallback(() => {
    // TODO: Implement cancellation
  }, []);

  return { results, loading, error, search, cancel };
}