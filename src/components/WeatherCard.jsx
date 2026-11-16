import React from 'react';

function WeatherCard({ data, loading, error }) {
  if (loading) {
    return (
      <div className="card">
        <h2>Current Weather</h2>
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading weather...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Current Weather</h2>
        <div className="error">
          Failed to load weather: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <h2>Current Weather</h2>
        <div className="card-content">No data available</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>
        Current Weather
        {data.cached && <span className="cache-indicator">Cached</span>}
      </h2>
      <div className="card-content">
        <div className="weather-main">
          <div className="temperature">{data.temperature}°F</div>
          <div className="condition">{data.condition}</div>
        </div>
        <div className="weather-details">
          <div className="weather-detail">
            <strong>Humidity:</strong> {data.humidity}%
          </div>
          <div className="weather-detail">
            <strong>Wind:</strong> {data.windSpeed} mph
          </div>
        </div>
        <div className="weather-detail">
          <strong>City:</strong> {data.city}
        </div>
      </div>
    </div>
  );
}

export default WeatherCard;