# Week 12: Advanced Async Patterns, the Weather Dashboard
## Make an Unreliable API Feel Reliable

### 🎯 Learning Objectives
By completing this project, you will:
- Write `fetchWithRetry`: a timeout with `AbortController`, and retries with exponential backoff
- Write a small cache with a time-to-live, and deduplicate requests that are already in flight
- Load four data sources in parallel with `Promise.allSettled`, so one failure does not block the rest
- Stretch: debounce a search box and cancel the stale request (`useSearch`), and poll for fresh data (`usePolling`)
- Stretch (Tiers): fill each card as its own request settles, pick the fastest of three sources with `Promise.any`, and stop retrying errors that will never succeed

### 📚 Prerequisites
Before starting, you should have:
- Attended the Week 12 lecture (Advanced JavaScript: promises and async/await)
- Read Modern JavaScript, chapter 10 (Promises and Async)
- Node 18 or newer (`node -v`)

### 🏗️ Project Overview
The starter is a weather dashboard that talks to a deliberately bad API: about 30% of its answers are errors and about 20% take two to five seconds. Today you make the dashboard dependable without touching the API: failed requests retry, repeated requests come from a cache, and the four cards load at the same time.

**What the starter gives you:** a complete Vite + React app: `src/App.jsx` (the dashboard), six components under `src/components/` (four cards, `SearchBar`, `StatusBar`), all the CSS, and a mock API server in `mock-api/server.js`. The code you write today goes into files that already exist as `TODO` stubs: `src/utils/asyncPatterns.js`, `src/services/dashboardService.js`, and (stretch) `src/hooks/useSearch.js` and `src/hooks/usePolling.js`. The app starts and runs before you change anything; it is just slow and often red.

**Fill the TODO in place; never make a new file with the name of one that exists, and never paste a second copy of a line.** Every code block below replaces a stub in a file that already exists. If a block repeats a line the starter already has (an `import`, a `const`, a `class`), keep one copy. A duplicated `import`, `const` or `class` is a syntax error that blanks the whole page.

**Not used today:** `src/services/weatherService.js`, `test-patterns.html`, and the stubs in `asyncPatterns.js` that no Part names (`fetchWithTimeout`, `fetchAllParallel`, `dedupedFetch`). Leave them as they are; they are extra practice for after class.

### 🚀 Getting Started

**Today's core is Parts 1 to 4 (about 50 minutes after a 10-minute setup). Parts 5 and 6 are the stretch, the Tiers come after. Each Part ends with a Checkpoint that says what you should see.**

**Commit at every Checkpoint** (`git add .` then `git commit -m "Part 2 works"`). If a later Part breaks the app and you run out of time, `git restore .` puts every file back to your last commit.

#### First: Create your own copy of this template
This repository is a GitHub **template** (GitHub Classroom is not used this term). Make your own copy of it, then clone that copy.

1. On this repository's page, click the green **Use this template** button and choose **Create a new repository**. On the next screen: Owner = your own GitHub account, Repository name = `in-person-project-10-<your-github-username>`, visibility **Public**. Click **Create repository**.
2. **Clone your new repository:**
   ```bash
   git clone https://github.com/<your-github-username>/in-person-project-10-<your-github-username>.git
   cd in-person-project-10-<your-github-username>
   ```

#### Second: Install and run (start this now)
Today there are **two** servers, each in its own terminal: the mock API (port 3001) and Vite (port 5173). Start the install first; on classroom wifi it can take a few minutes, and you can read Part 1 while it runs.

1. **Check Node:** `node -v` must print `v18` or newer. If it prints an older version or "command not found", install the current LTS from https://nodejs.org, open a new terminal and check again.
2. **Install dependencies** (once per clone; there is nothing extra to install):
   ```bash
   npm install
   ```
3. **Terminal 1: start the mock API** and keep it running all session:
   ```bash
   npm run api
   ```
   It prints "Mock API server running on http://localhost:3001", "Failure rate: 30%" and "Slow response rate: 20%".
4. **Terminal 2 (a second terminal in the same folder): start the dev server** and keep it running:
   ```bash
   npm run dev
   ```
5. **Check:** the browser opens http://localhost:5173 (open it yourself if it does not). You should see "Weather Dashboard", four cards (Current Weather, 5-Day Forecast, Weather News, Weather Alerts) and a "Problems to Fix" box. Some cards will be red. That is expected: it is the problem you are here to fix.

### 📝 Step-by-Step Instructions

#### Part 1: See the problem (5 minutes)

Open DevTools (F12 or Cmd+Option+I) and keep the **Console** and **Network** tabs within reach all session; today's Checkpoints are read there.

1. Click **Refresh All** five times, waiting for each to finish. Watch the cards: they load one after another, never together, and on most tries at least one card turns red ("Failed to load ...: Network response was not ok"). A Forecast, News or Alerts card that has turned red stays red until you reload the page, even when a later request succeeds: the starter never clears those three errors (Current Weather does clear its own).
2. In the Network tab, look at the rows for `weather`, `forecast`, `news` and `alerts`: some are red with status 503, and some take several seconds.
3. Reload the page and count the rows: each of the four endpoints is requested **twice**. React 18's `StrictMode` runs every effect twice in development, and nothing in the app notices that the same request is already on its way.
4. Open `src/App.jsx` and read `basicFetch` (top of the file) and `fetchAllData`: one `fetch`, no second try, and four `await`s in a row.

**Checkpoint 1:** you have seen a red card, a 503 row, a slow row, and the doubled requests on reload. Nothing to code yet.

#### Part 2: Retry with exponential backoff, and a timeout (15 minutes)

1. **Write the function.** In `src/utils/asyncPatterns.js`, replace the whole `export async function fetchWithRetry(...) { ... }` stub (the one whose body is two `TODO` comment lines and `return fetch(url, options);`) with this. Keep the comment block above it:
```javascript
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  const { timeout = 5000, ...fetchOptions } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // A fresh AbortController per attempt: it cancels the fetch if it takes too long
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { ...fetchOptions, signal: controller.signal });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`Failed after ${maxRetries + 1} attempts: ${url}`);
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms: ${url}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
```

2. **Use it in the dashboard.** In `src/App.jsx`, add one import under the `StatusBar` import:
```jsx
import { fetchWithRetry } from './utils/asyncPatterns';
```
   and replace the whole `basicFetch` function (and the `PROBLEM` comment above it) with:
```jsx
async function basicFetch(url) {
  const response = await fetchWithRetry(url, { timeout: 3000 });
  return response.json();
}
```

**Checkpoint 2:** click Refresh All five times. The Console prints lines like `Retry attempt 1 after 1000ms: http://localhost:3001/news?city=San%20Francisco`, and a red card is now rare: a card only fails when four attempts in a row fail, about one card load in thirty, so over five refreshes you may still meet one (its text is "HTTP 503" or a message containing "aborted"). The Network tab still shows red 503 rows: the failures still happen, the dashboard just no longer gives up on the first one. The page is slower than before: a refresh can take 10 seconds or more, because every retry waits and the cards still load one after another. That is the price of retrying; Part 4 takes most of it back.

What's happening here:
- `fetch` only rejects on a network failure; a 503 is a normal response, so the `!response.ok` check turns it into an error the `catch` can retry
- `AbortController` plus `setTimeout` is the timeout: after 3 seconds `controller.abort()` makes the `fetch` reject, and that attempt counts as a failure
- The wait doubles each time (1s, 2s, 4s), so a struggling server gets room to recover; `await new Promise(resolve => setTimeout(resolve, delay))` is how you pause inside an `async` function
- `finally` runs on every path (success, retry, final failure), so the timer is always cleared

#### Part 3: A cache, and no duplicate requests (15 minutes)

All of this Part's code goes into `src/utils/asyncPatterns.js`.

1. **Fill in the cache class.** Replace the whole `class RequestCache { ... }` stub with this class, and add the `const cache = ...` line at the end of the block directly under the class (that line is new; the starter has no `cache` yet):
```javascript
class RequestCache {
  constructor(ttl = 60000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new RequestCache(15000); // answers stay fresh for 15 seconds
```

2. **Write `cachedFetch`.** Replace the whole `export async function cachedFetch(...) { ... }` stub with this. It uses `pendingRequests`, which the starter already declares near the bottom of the file (`const pendingRequests = new Map();`); do not declare it again:
```javascript
export async function cachedFetch(url, options = {}) {
  // 1. A fresh answer in the cache: no request at all
  const cached = cache.get(url);
  if (cached) {
    console.log('Cache hit:', url);
    return { ...cached, cached: true };
  }

  // 2. The same request is already on its way: share its promise
  if (pendingRequests.has(url)) {
    console.log('Request deduped:', url);
    return pendingRequests.get(url);
  }

  // 3. Otherwise make the request, remember the answer, forget the pending entry
  const requestPromise = fetchWithRetry(url, options)
    .then(response => response.json())
    .then(data => {
      cache.set(url, data);
      return data;
    })
    .finally(() => {
      pendingRequests.delete(url);
    });

  pendingRequests.set(url, requestPromise);
  return requestPromise;
}
```

3. **Use it in the dashboard.** In `src/App.jsx`, change the import you added in Part 2 to import `cachedFetch` instead:
```jsx
import { cachedFetch } from './utils/asyncPatterns';
```
   and replace `basicFetch` again:
```jsx
async function basicFetch(url) {
  return cachedFetch(url, { timeout: 3000 });
}
```

**Checkpoint 3:** reload the page. The Console prints `Request deduped: ...` four times (once per endpoint: `StrictMode` asks for everything twice, and the second ask finds the first still in flight), and the Network tab shows each endpoint requested once instead of twice (a retried request adds its own red row). Now click Refresh All right away: the cards come back instantly, each title carries a grey **Cached** badge, the Console prints `Cache hit: ...` four times, and the Network tab shows no new rows. Wait 15 seconds and click Refresh All again: real requests go out and the badges disappear.

What's happening here:
- The cache is a `Map` from URL to `{ value, timestamp }`; `get` treats an entry older than the TTL as missing
- Deduplication stores the **promise**, not the answer: a second caller that arrives while the first request is in flight gets the same promise, so both receive the same result from one request
- Only successful answers are cached; a failed request rejects, `.finally` removes the pending entry, and the next call tries again
- The trade-off is visible: for 15 seconds Refresh All shows the cached answer. A cache trades freshness for speed; the TTL is where you choose how much

#### Part 4: Load all four in parallel with `Promise.allSettled` (15 minutes)

1. **Write the service.** In `src/services/dashboardService.js`, add this import as the first line of the file:
```javascript
import { cachedFetch } from '../utils/asyncPatterns';
```
   and replace the whole `export async function fetchDashboardData(city) { ... }` function (the sequential one with four `try` blocks) with:
```javascript
export async function fetchDashboardData(city) {
  const names = ['weather', 'forecast', 'news', 'alerts'];

  // Start all four requests at once; allSettled waits for every one, failed or not
  const results = await Promise.allSettled(
    names.map(name =>
      cachedFetch(
        `http://localhost:3001/${name}?city=${encodeURIComponent(city)}`,
        { timeout: 3000 }
      )
    )
  );

  const data = {};
  const errors = {};

  results.forEach((result, index) => {
    const name = names[index];

    if (result.status === 'fulfilled') {
      data[name] = result.value;
      errors[name] = null;
    } else {
      errors[name] = result.reason.message;
    }
  });

  return { data, errors };
}
```

2. **Use it in the dashboard.** In `src/App.jsx`:
   - change the import from Parts 2 and 3 (`import { cachedFetch } from './utils/asyncPatterns';`) to:
```jsx
import { fetchDashboardData } from './services/dashboardService';
```
   - delete the whole `basicFetch` function at the top of the file
   - inside `function App()`, delete two functions that sit one after the other: `fetchWeatherData` and `fetchAllData`. The block to delete starts at the comment line `// PROBLEM: No error handling, no retry, no caching` and ends at the `};` directly above `useEffect(() => {` (about 54 lines). Put this in its place:
```jsx
  const fetchAllData = async (cityName) => {
    setLoading({ weather: true, forecast: true, news: true, alerts: true });

    const { data, errors } = await fetchDashboardData(cityName);

    setDashboardData(prev => ({ ...prev, ...data }));
    setErrors(errors);
    setLoading({ weather: false, forecast: false, news: false, alerts: false });
  };
```
   The `useEffect`, `handleRefresh` and everything below stay as they are.

**Checkpoint 4:** wait 15 seconds (so the cache is stale) and click Refresh All: all four cards show their spinner at the same moment and fill together. In the Network tab the four requests start at the same time (look at the Waterfall column: the bars start at the same left edge instead of forming a staircase). Then prove that one failure blocks nothing: stop the API (Ctrl+C in Terminal 1), wait 15 seconds, click Refresh All. After about 7 seconds of retries all four cards turn red ("Failed to load ...: Failed to fetch" in Chrome; Firefox says "NetworkError when attempting to fetch resource" and Safari "Load failed"), the status bar says "4 services unavailable", and the page is still alive. Start the API again (`npm run api`), click Refresh All: the cards come back.

What's happening here:
- `names.map(...)` calls `cachedFetch` four times without `await`, so all four requests are already running before `allSettled` is called; that is what "parallel" means here
- `Promise.all` would reject as soon as one request failed and you would lose the other three answers. `Promise.allSettled` never rejects: it resolves to one `{ status: 'fulfilled', value }` or `{ status: 'rejected', reason }` per promise, in the same order as the input
- The dashboard now waits for the slowest of the four before it shows anything (a retry on one card holds back all four). Tier 1 fixes that
- One gap is left open on purpose: if you pick a new city while a slow load for the previous city is still running, whichever load finishes last wins, and it can be the old city. For today, pick a city after a refresh has finished. Part 5 fixes the same race for the search box; think about what `fetchAllData` would need

#### Part 5 (stretch): Search that waits and cancels (10 minutes)

Type "san" quickly into the search box with the Network tab open: three requests (`search?q=s`, `search?q=sa`, `search?q=san`), and because each takes a different time, the answer for "s" can arrive last and overwrite the answer for "san". That is a race condition.

1. **Write the hook.** In `src/hooks/useSearch.js`, replace the whole `export function useSearch(searchFn, delay = 500) { ... }` function with this. Keep the `import` line at the top of the file:
```javascript
export function useSearch(searchFn, delay = 500) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const timeoutRef = useRef(null);

  const search = useCallback((query) => {
    // A new keystroke: drop the timer and the request of the previous one
    clearTimeout(timeoutRef.current);
    abortControllerRef.current?.abort();

    if (!query) {
      setResults(null);
      setLoading(false);
      return;
    }

    // Debounce: wait until the typing pauses for `delay` ms
    timeoutRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const data = await searchFn(query, controller.signal);
        if (!controller.signal.aborted) {
          setResults(data);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
          setResults(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, delay);
  }, [searchFn, delay]);

  const cancel = useCallback(() => {
    clearTimeout(timeoutRef.current);
    abortControllerRef.current?.abort();
    setLoading(false);
  }, []);

  return { results, loading, error, search, cancel };
}
```

2. **Use it in the search box.** In `src/components/SearchBar.jsx`, replace everything from the first line of the file down to the line before `const handleSelectCity = (city) => {` (the `import`, the three `useState` lines and the whole `handleSearch` function) with:
```jsx
import React, { useState } from 'react';
import { useSearch } from '../hooks/useSearch';

// Defined outside the component so it is the same function on every render
async function searchCities(query, signal) {
  const response = await fetch(
    `http://localhost:3001/search?q=${encodeURIComponent(query)}`,
    { signal }
  );
  const data = await response.json();
  return data.results;
}

function SearchBar({ onCityChange }) {
  const [query, setQuery] = useState('');
  const { results, loading, search } = useSearch(searchCities, 300);
  const suggestions = results || [];

  const handleSearch = (value) => {
    setQuery(value);
    search(value);
  };

```
   Then, inside `handleSelectCity`, replace the line `setSuggestions([]);` with:
```jsx
    search('');
```
   The JSX below (`return ( ... )`) stays as it is: it already reads `query`, `loading` and `suggestions`.

**Checkpoint 5:** type "san" quickly: the Network tab shows **one** request, `search?q=san`, about a third of a second after the last key, and the list shows five cities. To see a cancellation, type "san", wait about half a second (the request goes out) and type " d" before the list appears: the `search?q=san` row turns to "(canceled)". It takes a try or two to hit the moment. Click "San Diego": the list closes and the four cards reload for San Diego.

What's happening here:
- Debouncing: every keystroke clears the previous timer and starts a new one, so the request only goes out when the typing pauses
- Cancellation: the `signal` is passed to `fetch`; `abort()` makes that `fetch` reject with an `AbortError`, which the `catch` ignores on purpose
- Each request keeps its **own** `controller` in a local `const`, so a late answer can check whether it is the one that was cancelled
- `useRef` holds the timer and the controller because changing them must not re-render the component; `useCallback` keeps `search` the same function between renders, so it can be passed around without restarting anything

#### Part 6 (stretch): Polling for fresh data (5 minutes)

1. **Write the hook.** In `src/hooks/usePolling.js`, replace the whole `export function usePolling(...) { ... }` function with this. Keep the `import` line at the top:
```javascript
export function usePolling(callback, interval = 30000, enabled = true) {
  const savedCallback = useRef(callback);

  // Always call the latest callback (it closes over the current city)
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    savedCallback.current(); // immediate first call

    const intervalId = setInterval(() => {
      savedCallback.current();
    }, interval);

    return () => clearInterval(intervalId); // cleanup on unmount
  }, [interval, enabled]);

  const refresh = () => {
    savedCallback.current();
  };

  return { refresh };
}
```

2. **Use it in the dashboard.** In `src/App.jsx`, add the import under the `fetchDashboardData` import:
```jsx
import { usePolling } from './hooks/usePolling';
```
   and add one line directly above `const handleRefresh = () => {`:
```jsx
  usePolling(() => fetchAllData(city), 30000);
```
   Keep the existing `useEffect(() => { fetchAllData(city); }, [city]);`: it reloads when the city changes; polling reloads when time passes.

**Checkpoint 6:** leave the page alone with the Network tab open. Every 30 seconds four new requests go out by themselves and "Last Update" in the status bar moves forward. On page load the Console now prints more `Request deduped` lines than before: the effect and the poll both ask for the same data at the same moment, and Part 3 turns that into one request per endpoint.

What's happening here:
- `setInterval` repeats; the function returned from `useEffect` is the cleanup, and `clearInterval` there is what prevents a timer that outlives the component
- The callback lives in a ref so the interval always calls the newest one (with the current `city`) without restarting the timer on every render

### 🏆 Challenge Extensions (if you finish early)

**Tier 1 (about 15 minutes): each card fills as soon as its own request settles.** Today all four cards wait for the slowest. Give `fetchDashboardData` a second parameter, a callback `onSettled(name, data, errorMessage)`, and call it from a `.then(...)` and a `.catch(...)` attached to each `cachedFetch` promise; in `App.jsx`, pass a callback that updates that one card's `dashboardData`, `errors` and `loading`. Keep `Promise.allSettled` to know when everything is done.
- **Done when:** on a refresh made after the 15-second cache has gone stale, where one request retries, the other three cards show their data while the fourth still shows its spinner.

**Tier 2 (about 15 minutes): the fastest of three sources with `Promise.any`.** The mock API has three more endpoints, `/weather-source1`, `/weather-source2` and `/weather-source3` (each takes `?city=`), with different, random delays. In `src/utils/asyncPatterns.js`, fill in the `getFastestSource(urls)` stub (ignore the stub's comment that says `Promise.race`): fetch all the URLs at once, turn each into its JSON (each source answers with `{ source, temp, city }`), and return the first one that succeeds with `Promise.any`. `fetch` resolves on a 404 or a 503 too, so reject when `response.ok` is false, or "first to succeed" can be an error page. Call it once from a `useEffect` in `App.jsx` and log the result's `source`.
- **Done when:** the Console prints one of `NOAA`, `Weather.com` or `OpenWeather` on load (twice, because `StrictMode` runs the effect twice), and over several reloads you see more than one name (NOAA wins most often). One sentence in your commit message on how `Promise.any` differs from `Promise.race` when the fastest promise rejects.

**Tier 3 (written for 253A students, open to anyone; about 20 minutes, a bounded task): do not retry what cannot succeed.** A 503 may work on the next try; a 404 never will. Change `fetchWithRetry` so an HTTP status from 400 to 499 is thrown at once with no retry, while 5xx responses, timeouts and network failures still retry. (Hint: attach the status to the error you throw, `error.status = response.status`, and check it at the top of the `catch`.)
- **Done when:** `fetchWithRetry('http://localhost:3001/nope')` called from a `useEffect` (with a `.catch` that logs the error) fails after one attempt with no `Retry attempt` line in the Console, and the dashboard's 503s still retry as before.

### 🐛 Troubleshooting Guide

**Every card is red with "Failed to fetch".** The mock API is not running. Start it in its own terminal: `npm run api`. It must stay running next to `npm run dev`.

**`npm run api` fails with "EADDRINUSE: address already in use :::3001".** An API server is already running in another terminal (or an old one never stopped). Use that one, or close it and start again.

**The page is blank and the Console says "Identifier 'RequestCache' has already been declared" (or `cache`, `pendingRequests`, `cachedFetch`, or any import).** A code block was pasted next to the stub it replaces instead of over it. Keep one copy. `pendingRequests` is declared once, near the bottom of `asyncPatterns.js`, by the starter.

**"Cannot access 'cache' before initialization".** The line `const cache = new RequestCache(15000);` must sit directly under the closing `}` of `class RequestCache`, not above the class.

**Refresh All does nothing new.** The answers are less than 15 seconds old, so they come from the cache (the Cached badge shows it). Wait 15 seconds, or reload the page: a reload empties the cache, because the cache lives in the page's memory.

**The cards never show a Cached badge.** `cachedFetch` must return `{ ...cached, cached: true }` on a cache hit (Part 3 step 2), and `App.jsx` must call `cachedFetch` (Part 3 step 3) or `fetchDashboardData` (Part 4), not `fetchWithRetry` directly.

**The Console shows red "Failed to load resource: 503" lines.** Expected: that is the mock API failing on purpose. What matters is that a `Retry attempt` line follows and the card fills.

**The search list never appears after Part 5.** `searchCities` must return `data.results`, and the component must read `const suggestions = results || [];`.

**"node_modules" shows up in `git status`.** The repository's `.gitignore` already excludes it; if you deleted that file, restore it before `git add .`.

### 📖 Resources & References
- [MDN: Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)
- [MDN: Promise.any](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any)
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN: async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)
- [Exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff)

### ✅ What "complete" means (complete/incomplete grade)

A pushed repository with commits made today whose app shows (a) and (b), and (c) too if you reached Part 4:
- (a) Part 2: `fetchWithRetry` is written and the dashboard uses it; the Console prints `Retry attempt` lines
- (b) Part 3: `RequestCache` and `cachedFetch` are written; Refresh All within 15 seconds shows the Cached badges with no new requests, and a reload prints `Request deduped`
- (c) Part 4: `fetchDashboardData` loads the four sections with `Promise.allSettled` and `App.jsx` uses it; with the API stopped the cards turn red and the page stays alive

Parts 5 and 6 and the Tiers are optional. If you stop before Part 4, push what works: an app with (a) and (b) plus a commit message that says where you stopped is COMPLETE. A broken Part 4 pushed over a working (a) and (b) is not: if Part 4 is half done when time runs out, run `git restore .` to return to your last Checkpoint commit, then push.

Before you leave: `git add .`, `git commit -m "In-person project 10"`, `git push`, then paste your repository URL into the bCourses assignment.
