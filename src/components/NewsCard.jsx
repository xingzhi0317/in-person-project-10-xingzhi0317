import React from 'react';

function NewsCard({ data, loading, error }) {
  if (loading) {
    return (
      <div className="card">
        <h2>Weather News</h2>
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading news...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h2>Weather News</h2>
        <div className="error">
          Failed to load news: {error}
        </div>
      </div>
    );
  }

  if (!data || !data.articles) {
    return (
      <div className="card">
        <h2>Weather News</h2>
        <div className="card-content">No news available</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>
        Weather News
        {data.cached && <span className="cache-indicator">Cached</span>}
      </h2>
      <div className="card-content">
        <div className="news-list">
          {data.articles.map(article => (
            <div key={article.id} className="news-item">
              <h4>{article.title}</h4>
              <p>{article.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NewsCard;