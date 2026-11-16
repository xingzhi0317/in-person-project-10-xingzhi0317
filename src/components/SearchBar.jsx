import React, { useState } from 'react';

function SearchBar({ onCityChange }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // PROBLEM: No debouncing, causes race conditions
  const handleSearch = async (value) => {
    setQuery(value);

    if (!value) {
      setSuggestions([]);
      return;
    }

    setLoading(true);

    try {
      // PROBLEM: No cancellation of previous requests
      const response = await fetch(`http://localhost:3001/search?q=${value}`);
      const data = await response.json();

      // PROBLEM: Results might arrive out of order
      setSuggestions(data.results);
    } catch (error) {
      console.error('Search failed:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCity = (city) => {
    setQuery(city);
    setSuggestions([]);
    onCityChange(city);
  };

  return (
    <div className="search-container" style={{ position: 'relative' }}>
      <input
        type="text"
        className="search-input"
        placeholder="Search for a city..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />

      {loading && (
        <div style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#999'
        }}>
          Searching...
        </div>
      )}

      {suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginTop: '5px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          {suggestions.map((city, index) => (
            <div
              key={index}
              onClick={() => handleSelectCity(city)}
              style={{
                padding: '10px 15px',
                cursor: 'pointer',
                borderBottom: index < suggestions.length - 1 ? '1px solid #eee' : 'none',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.target.style.background = 'white'}
            >
              {city}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;