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

export async function fetchDashboardData(city) {
  const names = ['weather', 'forecast', 'news', 'alerts'];

  // Start all four requests at once; allSettled waits for every one, failed or not
  const results = await Promise.allSettled(
    names.map(name =>
      cachedFetch(
        `http://localhost:3001/${name}?city=${encodeURIComponent(city)}`,
        { timeout: 3000 }
      )
    )
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
