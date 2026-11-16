import { cachedFetch } from '../utils/asyncPatterns';

/**
 * TODO: Implement a service that coordinates multiple API calls
 *
 * Requirements:
 * 1. Fetch all dashboard data in parallel
 * 2. Handle partial failures gracefully
 * 3. Provide fallback data when services fail
 * 4. Use caching to optimize performance
 */

export async function fetchDashboardData(city, onSettled) {
  const names = ['weather', 'forecast', 'news', 'alerts'];

  // Start all four requests at once; allSettled waits for every one, failed or not
  const results = await Promise.allSettled(
    names.map(name => {
      const promise = cachedFetch(
        `http://localhost:3001/${name}?city=${encodeURIComponent(city)}`,
        { timeout: 3000 }
      );

      // Tier 1: report each card as soon as its own request settles
      if (onSettled) {
        promise
          .then(data => onSettled(name, data, null))
          .catch(error => onSettled(name, null, error.message));
      }

      return promise;
    })
  );

  const data = {};
  const errors = {};

  results.forEach((result, index) => {
    const name = names[index];

    if (result.status === 'fulfilled') {
      data[name] = result.value;
      errors[name] = null;
    } else {
      errors[name] = result.reason.message;
    }
  });

  return { data, errors };
}
