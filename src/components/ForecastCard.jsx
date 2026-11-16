import React from 'react';

function ForecastCard({ data, loading, error }) {
  if (loading) {
    return (
      <div className="card">
        <h2>5-Day Forecast</h2>
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading forecast...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>5-Day Forecast</h2>
        <div className="error">
          Failed to load forecast: {error}
        </div>
      </div>
    );
  }

  if (!data || !data.forecast) {
    return (
      <div className="card">
        <h2>5-Day Forecast</h2>
        <div className="card-content">No forecast available</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>
        5-Day Forecast
        {data.cached && <span className="cache-indicator">Cached</span>}
      </h2>
      <div className="card-content">
        <div className="forecast-list">
          {data.forecast.map((day, index) => (
            <div key={index} className="forecast-day">
              <div className="day">{day.day}</div>
              <div className="temps">
                {day.high}° / {day.low}°
              </div>
              <div style={{ fontSize: '0.8rem', color: '#999' }}>
                {day.condition}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ForecastCard;