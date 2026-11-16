import React, { useState, useEffect } from 'react';
import WeatherCard from './components/WeatherCard';
import ForecastCard from './components/ForecastCard';
import NewsCard from './components/NewsCard';
import AlertsCard from './components/AlertsCard';
import SearchBar from './components/SearchBar';
import StatusBar from './components/StatusBar';
import { fetchDashboardData } from './services/dashboardService';
import { usePolling } from './hooks/usePolling';

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

  const fetchAllData = async (cityName) => {
    setLoading({ weather: true, forecast: true, news: true, alerts: true });

    const { data, errors } = await fetchDashboardData(cityName);

    setDashboardData(prev => ({ ...prev, ...data }));
    setErrors(errors);
    setLoading({ weather: false, forecast: false, news: false, alerts: false });
  };

  useEffect(() => {
    fetchAllData(city);
  }, [city]);

  usePolling(() => fetchAllData(city), 30000);

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