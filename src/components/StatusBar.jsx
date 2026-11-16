import React from 'react';

function StatusBar({ loading, errors, lastUpdate }) {
  const loadingCount = Object.values(loading).filter(l => l).length;
  const errorCount = Object.values(errors).filter(e => e).length;

  const getStatusColor = () => {
    if (errorCount > 0) return 'error';
    if (loadingCount > 0) return 'warning';
    return 'success';
  };

  const getStatusText = () => {
    if (loadingCount > 0) {
      return `Loading ${loadingCount} service${loadingCount > 1 ? 's' : ''}...`;
    }
    if (errorCount > 0) {
      return `${errorCount} service${errorCount > 1 ? 's' : ''} unavailable`;
    }
    return 'All services operational';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="status-bar">
      <div className="status-item">
        <div className={`status-dot ${getStatusColor()}`}></div>
        <span>{getStatusText()}</span>
      </div>
      <div className="status-item">
        <span>Last Update: {formatTime(lastUpdate)}</span>
      </div>
    </div>
  );
}

export default StatusBar;