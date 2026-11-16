import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Simulate network issues
const FAILURE_RATE = 0.3; // 30% chance of failure
const SLOW_RATE = 0.2; // 20% chance of being slow

// Helper to simulate network conditions
function simulateNetworkConditions() {
  return new Promise((resolve, reject) => {
    const random = Math.random();

    // Simulate failures
    if (random < FAILURE_RATE) {
      setTimeout(() => {
        reject(new Error('Network error'));
      }, 100);
      return;
    }

    // Simulate slow responses
    const delay = random < FAILURE_RATE + SLOW_RATE ?
      2000 + Math.random() * 3000 : // Slow: 2-5 seconds
      100 + Math.random() * 400;     // Normal: 100-500ms

    setTimeout(resolve, delay);
  });
}

// Weather endpoint
app.get('/weather', async (req, res) => {
  try {
    await simulateNetworkConditions();

    const { city = 'San Francisco' } = req.query;

    res.json({
      city,
      temperature: Math.round(50 + Math.random() * 40),
      condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
      humidity: Math.round(40 + Math.random() * 40),
      windSpeed: Math.round(5 + Math.random() * 20),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});

// Forecast endpoint
app.get('/forecast', async (req, res) => {
  try {
    await simulateNetworkConditions();

    const { city = 'San Francisco' } = req.query;

    const forecast = Array.from({ length: 5 }, (_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(new Date().getDay() + i) % 7],
      high: Math.round(60 + Math.random() * 30),
      low: Math.round(40 + Math.random() * 20),
      condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)]
    }));

    res.json({
      city,
      forecast,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});

// News endpoint
app.get('/news', async (req, res) => {
  try {
    await simulateNetworkConditions();

    const { city = 'San Francisco' } = req.query;

    const news = [
      { title: `Weather Alert for ${city}`, summary: 'Conditions expected to change...', id: 1 },
      { title: 'Climate Update', summary: 'Recent patterns show...', id: 2 },
      { title: 'Weekend Forecast', summary: 'Plan your activities...', id: 3 }
    ];

    res.json({
      city,
      articles: news,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});

// Alerts endpoint
app.get('/alerts', async (req, res) => {
  try {
    await simulateNetworkConditions();

    const { city = 'San Francisco' } = req.query;

    const hasAlert = Math.random() > 0.7; // 30% chance of alert

    res.json({
      city,
      active: hasAlert,
      alerts: hasAlert ? [{
        type: 'warning',
        message: 'High wind advisory in effect',
        severity: 'moderate'
      }] : [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ error: 'Service temporarily unavailable' });
  }
});

// Multiple weather sources for race/any patterns
app.get('/weather-source1', async (req, res) => {
  await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
  res.json({ source: 'NOAA', temp: 72, city: req.query.city });
});

app.get('/weather-source2', async (req, res) => {
  await new Promise(r => setTimeout(r, 800 + Math.random() * 1500));
  res.json({ source: 'Weather.com', temp: 71, city: req.query.city });
});

app.get('/weather-source3', async (req, res) => {
  await new Promise(r => setTimeout(r, 300 + Math.random() * 2000));
  res.json({ source: 'OpenWeather', temp: 73, city: req.query.city });
});

// Search endpoint
app.get('/search', async (req, res) => {
  const { q } = req.query;

  // Simulate variable response times
  await new Promise(r => setTimeout(r, 200 + Math.random() * 800));

  const cities = [
    'San Francisco', 'San Diego', 'San Jose', 'Santa Clara', 'Sacramento',
    'Los Angeles', 'New York', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'Dallas', 'Austin', 'Seattle'
  ];

  const results = cities
    .filter(city => city.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 5);

  res.json({ results, query: q });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log(`Failure rate: ${FAILURE_RATE * 100}%`);
  console.log(`Slow response rate: ${SLOW_RATE * 100}%`);
});