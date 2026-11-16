import React, { useState, useEffect, useRef } from 'react';
import WeatherCard from './components/WeatherCard';
import ForecastCard from './components/ForecastCard';
import NewsCard from './components/NewsCard';
import AlertsCard from './components/AlertsCard';
import SearchBar from './components/SearchBar';
import StatusBar from './components/StatusBar';
import { fetchDashboardData } from './services/dashboardService';
import { usePolling } from './hooks/usePolling';
import { fetchWithRetry, getFastestSource } from './utils/asyncPatterns';

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

  // The city of the most recent load: answers for an older city are ignored
  const latestCityRef = useRef(city);

  const fetchAllData = async (cityName) => {
    latestCityRef.current = cityName;
    setLoading({ weather: true, forecast: true, news: true, alerts: true });

    // Tier 1: fill each card as soon as its own request settles
    const onSettled = (name, data, errorMessage) => {
      if (latestCityRef.current !== cityName) return;
      if (data) {
        setDashboardData(prev => ({ ...prev, [name]: data }));
      }
      setErrors(prev => ({ ...prev, [name]: errorMessage }));
      setLoading(prev => ({ ...prev, [name]: false }));
    };

    // allSettled still tells us when every card is done
    await fetchDashboardData(cityName, onSettled);
  };

  useEffect(() => {
    fetchAllData(city);
  }, [city]);

  // Tier 2: the fastest of three sources with Promise.any
  useEffect(() => {
    const urls = [1, 2, 3].map(
      n => `http://localhost:3001/weather-source${n}?city=${encodeURIComponent(city)}`
    );
    getFastestSource(urls)
      .then(result => console.log('Fastest source:', result.source))
      .catch(error => console.error('All sources failed:', error));
  }, []);

  // Tier 3: a 404 fails after one attempt, with no retry
  useEffect(() => {
    fetchWithRetry('http://localhost:3001/nope')
      .catch(error => console.log(`No retry for client error: ${error.message}`));
  }, []);

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

      {/* Async patterns implemented in this project */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h2>Problems Fixed:</h2>
        <ul style={{ paddingLeft: '20px', color: '#666' }}>
          <li>✅ Retry with exponential backoff (fetchWithRetry)</li>
          <li>✅ 15s TTL cache + in-flight request dedup (cachedFetch)</li>
          <li>✅ Parallel loading with Promise.allSettled, each card fills as it settles</li>
          <li>✅ Debounced, cancellable search (useSearch + AbortController)</li>
          <li>✅ 3s request timeout via AbortController</li>
          <li>✅ Polling every 30s (usePolling)</li>
        </ul>
      </div>
    </div>
  );
}

export default App;