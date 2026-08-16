/**
 * Which works this visitor has already walked up to.
 *
 * Backed by localStorage when it is available, but never dependent on it —
 * private browsing, blocked storage and corrupted values all degrade to an
 * in-memory session rather than breaking the gallery.
 */

export const STORAGE_KEY = 'the-long-room:viewed';

function read(storage) {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => typeof entry === 'string');
  } catch {
    return [];
  }
}

function write(storage, values) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(values));
  } catch {
    // Storage refused us. The session still works; it just will not be remembered.
  }
}

export function createProgress(storage = globalThis.localStorage) {
  const seen = read(storage);
  const listeners = new Set();

  return {
    /** Slugs in the order they were first viewed. */
    viewed: () => [...seen],
    count: () => seen.length,
    has: (slug) => seen.includes(slug),

    /** Returns true only the first time a given work is marked. */
    markViewed(slug) {
      if (seen.includes(slug)) return false;
      seen.push(slug);
      write(storage, seen);
      listeners.forEach((listener) => listener([...seen], slug));
      return true;
    },

    reset() {
      seen.length = 0;
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {
        /* nothing to do */
      }
      listeners.forEach((listener) => listener([], null));
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
