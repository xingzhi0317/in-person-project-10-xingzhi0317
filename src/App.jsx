import React, { useState, useEffect } from 'react';
import WeatherCard from './components/WeatherCard';
import ForecastCard from './components/ForecastCard';
import NewsCard from './components/NewsCard';
import AlertsCard from './components/AlertsCard';
import SearchBar from './components/SearchBar';
import StatusBar from './components/StatusBar';
import { cachedFetch } from './utils/asyncPatterns';

async function basicFetch(url) {
  return cachedFetch(url, { timeout: 3000 });
}

function App() {
  const [city, setCity] = useState('San Francisco');
  const [dashboardData, setDashboardData] = useState({
    weather: null,
    forecast: null,
    news: null,
    alerts: null
  });
  const [loading, setLoading] = useState({
    weather: false,
    forecast: false,
    news: false,
    alerts: false
  });
  const [errors, setErrors] = useState({
    weather: null,
    forecast: null,
    news: null,
    alerts: null
  });

  // PROBLEM: No error handling, no retry, no caching
  const fetchWeatherData = async (cityName) => {
    setLoading(prev => ({ ...prev, weather: true }));
    setErrors(prev => ({ ...prev, weather: null }));

    try {
      const data = await basicFetch(`http://localhost:3001/weather?city=${cityName}`);
      setDashboardData(prev => ({ ...prev, weather: data }));
    } catch (error) {
      setErrors(prev => ({ ...prev, weather: error.message }));
      console.error('Weather fetch failed:', error);
    } finally {
      setLoading(prev => ({ ...prev, weather: false }));
    }
  };

  // PROBLEM: All requests are sequential, not parallel
  const fetchAllData = async (cityName) => {
    // Fetch weather
    await fetchWeatherData(cityName);

    // Fetch forecast
    setLoading(prev => ({ ...prev, forecast: true }));
    try {
      const data = await basicFetch(`http://localhost:3001/forecast?city=${cityName}`);
      setDashboardData(prev => ({ ...prev, forecast: data }));
    } catch (error) {
      setErrors(prev => ({ ...prev, forecast: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, forecast: false }));
    }

    // Fetch news
    setLoading(prev => ({ ...prev, news: true }));
    try {
      const data = await basicFetch(`http://localhost:3001/news?city=${cityName}`);
      setDashboardData(prev => ({ ...prev, news: data }));
    } catch (error) {
      setErrors(prev => ({ ...prev, news: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, news: false }));
    }

    // Fetch alerts
    setLoading(prev => ({ ...prev, alerts: true }));
    try {
      const data = await basicFetch(`http://localhost:3001/alerts?city=${cityName}`);
      setDashboardData(prev => ({ ...prev, alerts: data }));
    } catch (error) {
      setErrors(prev => ({ ...prev, alerts: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, alerts: false }));
    }
  };

  useEffect(() => {
    fetchAllData(city);
  }, [city]);

  const handleRefresh = () => {
    fetchAllData(city);
  };

  const handleCityChange = (newCity) => {
    setCity(newCity);
  };

  const isAnyLoading = Object.values(loading).some(l => l);

  return (
    <div className="container">
      <header className="header">
        <h1>Weather Dashboard</h1>
        <p>Advanced Async Patterns Demo</p>
      </header>

      <StatusBar
        loading={loading}
        errors={errors}
        lastUpdate={dashboardData.weather?.timestamp}
      />

      <div className="search-section">
        <SearchBar onCityChange={handleCityChange} />
        <button
          className="btn"
          onClick={handleRefresh}
          disabled={isAnyLoading}
        >
          {isAnyLoading ? 'Refreshing...' : 'Refresh All'}
        </button>
      </div>

      <div className="dashboard-grid">
        <WeatherCard
          data={dashboardData.weather}
          loading={loading.weather}
          error={errors.weather}
        />
        <ForecastCard
          data={dashboardData.forecast}
          loading={loading.forecast}
          error={errors.forecast}
        />
        <NewsCard
          data={dashboardData.news}
          loading={loading.news}
          error={errors.news}
        />
        <AlertsCard
          data={dashboardData.alerts}
          loading={loading.alerts}
          error={errors.alerts}
        />
      </div>

      {/* TODO: Add these features */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h2>Problems to Fix:</h2>
        <ul style={{ paddingLeft: '20px', color: '#666' }}>
          <li>❌ No retry when requests fail (30% failure rate!)</li>
          <li>❌ No caching (duplicate requests waste bandwidth)</li>
          <li>❌ Sequential loading (should load in parallel)</li>
          <li>❌ Race conditions in search (type fast and see wrong results)</li>
          <li>❌ No request timeouts (can hang forever)</li>
          <li>❌ No polling for updates</li>
        </ul>
      </div>
    </div>
  );
}

export default App;