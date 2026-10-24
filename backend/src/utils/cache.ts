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

export function invalidate(prefix?: string) {
  if (!prefix) {
    cache.flushAll();
    return;
  }
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  cache.del(keys);
}

export default cache;
