import React from 'react';

function AlertsCard({ data, loading, error }) {
  if (loading) {
    return (
      <div className="card">
        <h2>Weather Alerts</h2>
        <div className="loading">
          <div className="loading-spinner"></div>
          Checking for alerts...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Weather Alerts</h2>
        <div className="error">
          Failed to check alerts: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <h2>Weather Alerts</h2>
        <div className="card-content">Unable to check alerts</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>
        Weather Alerts
        {data.cached && <span className="cache-indicator">Cached</span>}
      </h2>
      <div className="card-content">
        {data.active && data.alerts?.length > 0 ? (
          <div className="alert-box">
            {data.alerts.map((alert, index) => (
              <div key={index}>
                <strong>{alert.type.toUpperCase()}:</strong> {alert.message}
                <div style={{ fontSize: '0.85rem', marginTop: '5px' }}>
                  Severity: {alert.severity}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert-box success">
            No active weather alerts for {data.city}
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertsCard;