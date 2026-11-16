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
  // TODO: Implement polling logic

  const refresh = () => {
    // TODO: Manual refresh implementation
    callback();
  };

  return { refresh };
}