import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Returns a cached value for `key` or computes it via `fn`, stores it with TTL (seconds),
 * and returns it. Safe for sync/async getters.
 */
export async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get<T>(key);
  if (hit !== undefined) {
    return hit;
  }
  const value = await fn();
  cache.set(key, value, ttl);
  return value;
}

/**
 * Delete every key under a prefix. A trailing `*` is accepted (and ignored) so
 * callers can write `services:shop:<id>:*` — previously the `*` made the
 * prefix never match, which left stale lists after mutations.
 */
export function invalidate(prefix?: string) {
  if (!prefix) {
    cache.flushAll();
    return 0;
  }
  const normalized = prefix.endsWith('*') ? prefix.slice(0, -1) : prefix;
  const keys = cache.keys().filter((k) => k.startsWith(normalized));
  if (keys.length) cache.del(keys);
  return keys.length;
}

/** Lightweight hit/miss counters for diagnostics. */
export function cacheStats() {
  return cache.getStats();
}

export default cache;
