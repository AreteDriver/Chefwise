/**
 * In-memory rate limiting middleware for API routes.
 *
 * Limits requests per IP (or user ID when authenticated) within
 * a sliding window. State resets on server restart, which is
 * acceptable for a serverless/edge deployment where persistent
 * rate limiting would use Redis or similar.
 *
 * Usage:
 *   import { rateLimit } from '@/middleware/rateLimit';
 *
 *   const limiter = rateLimit({ windowMs: 60000, max: 10 });
 *
 *   export async function handler(req, res) {
 *     const blocked = limiter(req, res);
 *     if (blocked) return; // response already sent
 *     // ... handle request
 *   }
 */

const stores = new Map();

function getStore(name) {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  return stores.get(name);
}

/**
 * @param {Object} options
 * @param {number} options.windowMs - Time window in ms (default: 60 000 = 1 min)
 * @param {number} options.max - Max requests per window (default: 20)
 * @param {string} [options.name] - Store name to allow separate limits per route
 * @returns {Function} Middleware that returns true if rate-limited (response already sent)
 */
export function rateLimit({ windowMs = 60_000, max = 20, name = 'default' } = {}) {
  const store = getStore(name);

  // Periodically clean up expired entries (every 5 minutes)
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now - entry.windowStart > windowMs * 2) {
        store.delete(key);
      }
    }
  }, 5 * 60_000).unref?.();

  return function checkRateLimit(req, res) {
    const key = req.user?.uid
      || req.headers?.['x-forwarded-for']?.split(',')[0]?.trim()
      || 'anonymous';

    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      entry = { count: 1, windowStart: now };
      store.set(key, entry);
    } else {
      entry.count += 1;
    }

    const remaining = Math.max(0, max - entry.count);
    const resetTime = entry.windowStart + windowMs;

    // Set rate limit headers
    if (res.setHeader) {
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000));
    }

    if (entry.count > max) {
      const retryAfter = Math.ceil((resetTime - now) / 1000);
      if (res.setHeader) {
        res.setHeader('Retry-After', retryAfter);
      }
      res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfter,
      });
      return true;
    }

    return false;
  };
}
