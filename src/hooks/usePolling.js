import { useEffect, useRef } from 'react';

/**
 * TODO: Implement usePolling hook
 *
 * Requirements:
 * 1. Call the callback function at specified intervals
 * 2. Make an immediate first call when enabled
 * 3. Clean up intervals properly on unmount
 * 4. Provide a manual refresh function
 *
 * @param {Function} callback - Function to call at intervals
 * @param {number} interval - Polling interval in milliseconds
 * @param {boolean} enabled - Whether polling is enabled
 * @returns {object} - { refresh }
 */
export function usePolling(callback, interval = 30000, enabled = true) {
  const savedCallback = useRef(callback);

  // Always call the latest callback (it closes over the current city)
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    savedCallback.current(); // immediate first call

    const intervalId = setInterval(() => {
      savedCallback.current();
    }, interval);

    return () => clearInterval(intervalId); // cleanup on unmount
  }, [interval, enabled]);

  const refresh = () => {
    savedCallback.current();
  };

  return { refresh };
}