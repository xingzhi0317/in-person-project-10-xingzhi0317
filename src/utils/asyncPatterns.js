// ============================================
// ASYNC PATTERNS TO IMPLEMENT
// ============================================

/**
 * TODO: Implement fetchWithRetry
 *
 * Requirements:
 * 1. Try to fetch the URL up to maxRetries times
 * 2. Use exponential backoff between retries (1s, 2s, 4s, etc.)
 * 3. Add timeout support to prevent hanging requests
 * 4. Log retry attempts for debugging
 *
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options plus timeout
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<Response>} - The fetch response
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  const { timeout = 5000, ...fetchOptions } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // A fresh AbortController per attempt: it cancels the fetch if it takes too long
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { ...fetchOptions, signal: controller.signal });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return response;
    } catch (error) {
      // Tier 3: a 4xx will never succeed, so fail at once without retrying
      if (error.status >= 400 && error.status < 500) {
        console.error(`Client error ${error.status}, not retrying: ${url}`);
        throw error;
      }

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

/**
 * TODO: Implement RequestCache class
 *
 * Requirements:
 * 1. Store successful responses with timestamps
 * 2. Automatically expire entries after TTL
 * 3. Provide get, set, and clear methods
 */
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

/**
 * TODO: Implement cachedFetch
 *
 * Requirements:
 * 1. Check cache first, return if found and not expired
 * 2. Deduplicate concurrent requests to same URL
 * 3. Cache successful responses
 * 4. Use fetchWithRetry for actual requests
 *
 * @param {string} url - The URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - Parsed JSON response
 */
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

/**
 * TODO: Implement fetchWithTimeout
 *
 * Requirements:
 * 1. Race the fetch against a timeout
 * 2. Throw error if timeout occurs first
 * 3. Clean up properly on success or failure
 *
 * @param {string} url - The URL to fetch
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>} - The fetch response
 */
export async function fetchWithTimeout(url, timeout = 5000) {
  // TODO: Implement timeout using Promise.race
  return fetch(url);
}

/**
 * TODO: Implement parallel fetch with resilience
 *
 * Requirements:
 * 1. Fetch multiple URLs in parallel
 * 2. Use Promise.allSettled to get all results
 * 3. Return structured results with success/error status
 *
 * @param {Array} requests - Array of {name, url} objects
 * @returns {Promise<object>} - Object with results keyed by name
 */
export async function fetchAllParallel(requests) {
  // TODO: Implement parallel fetching with Promise.allSettled
  const results = {};

  // For now, fetch sequentially (this is what we're fixing!)
  for (const req of requests) {
    try {
      const response = await fetch(req.url);
      results[req.name] = await response.json();
    } catch (error) {
      results[req.name] = { error: error.message };
    }
  }

  return results;
}

/**
 * TODO: Implement race pattern for fastest response
 *
 * Requirements:
 * 1. Try multiple sources simultaneously
 * 2. Return first successful response
 * 3. Handle case where all fail
 *
 * @param {Array<string>} urls - Array of URLs to race
 * @returns {Promise<any>} - First successful response
 */
export async function getFastestSource(urls) {
  // Start every request at once; each rejects on a non-2xx so an error page never "wins"
  const attempts = urls.map(async url => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${url}`);
    }
    return response.json();
  });

  // Promise.any: the first one to *succeed* (rejects with AggregateError only if all fail)
  return Promise.any(attempts);
}

/**
 * TODO: Implement request deduplication
 *
 * This should prevent multiple identical requests from being made
 * simultaneously. If a request is already in progress, return the
 * same promise.
 */
const pendingRequests = new Map();

export function dedupedFetch(url, options = {}) {
  // TODO: Implement deduplication logic
  return fetch(url, options);
}