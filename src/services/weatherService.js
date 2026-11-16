/**
 * TODO: Refactor this service to use advanced async patterns
 *
 * Current problems:
 * - No retry on failure
 * - No caching
 * - No timeout handling
 * - No graceful degradation
 */

// Basic fetch that fails often
export async function getWeatherData(city) {
  try {
    const response = await fetch(
      `http://localhost:3001/weather?city=${encodeURIComponent(city)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// TODO: Implement these improved versions:

export async function getWeatherWithRetry(city) {
  // TODO: Use fetchWithRetry from utils
  return getWeatherData(city);
}

export async function getCachedWeather(city) {
  // TODO: Use cachedFetch from utils
  return getWeatherData(city);
}

export async function getWeatherFromFastestSource(city) {
  // TODO: Use Promise.race with multiple weather sources
  return getWeatherData(city);
}

export async function getWeatherWithFallback(city) {
  // TODO: Use Promise.any for automatic failover
  return getWeatherData(city);
}