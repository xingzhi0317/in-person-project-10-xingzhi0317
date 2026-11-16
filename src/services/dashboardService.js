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
  // TODO: Replace sequential fetching with parallel fetching
  // using Promise.allSettled

  const dashboardData = {};

  // Current implementation: Sequential (slow!)
  try {
    const weatherResponse = await fetch(`http://localhost:3001/weather?city=${city}`);
    dashboardData.weather = await weatherResponse.json();
  } catch (error) {
    dashboardData.weather = { error: true };
  }

  try {
    const forecastResponse = await fetch(`http://localhost:3001/forecast?city=${city}`);
    dashboardData.forecast = await forecastResponse.json();
  } catch (error) {
    dashboardData.forecast = { error: true };
  }

  try {
    const newsResponse = await fetch(`http://localhost:3001/news?city=${city}`);
    dashboardData.news = await newsResponse.json();
  } catch (error) {
    dashboardData.news = { error: true };
  }

  try {
    const alertsResponse = await fetch(`http://localhost:3001/alerts?city=${city}`);
    dashboardData.alerts = await alertsResponse.json();
  } catch (error) {
    dashboardData.alerts = { error: true };
  }

  return dashboardData;
}