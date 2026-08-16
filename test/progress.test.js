import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createProgress, STORAGE_KEY } from '../src/interaction/progress.js';

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

describe('createProgress', () => {
  let storage;

  beforeEach(() => {
    storage = memoryStorage();
  });

  it('starts empty', () => {
    const progress = createProgress(storage);
    expect(progress.count()).toBe(0);
    expect(progress.has('gulf-weather')).toBe(false);
    expect(progress.viewed()).toEqual([]);
  });

  it('records a viewing', () => {
    const progress = createProgress(storage);
    progress.markViewed('gulf-weather');
    expect(progress.has('gulf-weather')).toBe(true);
    expect(progress.count()).toBe(1);
  });

  it('does not double-count the same work', () => {
    const progress = createProgress(storage);
    progress.markViewed('gulf-weather');
    progress.markViewed('gulf-weather');
    expect(progress.count()).toBe(1);
  });

  it('reports whether a marking was new, so callers can react once', () => {
    const progress = createProgress(storage);
    expect(progress.markViewed('gulf-weather')).toBe(true);
    expect(progress.markViewed('gulf-weather')).toBe(false);
  });

  it('persists to storage and restores on the next visit', () => {
    createProgress(storage).markViewed('seed-that-refused');
    const returning = createProgress(storage);
    expect(returning.has('seed-that-refused')).toBe(true);
  });

  it('preserves the order works were seen in', () => {
    const progress = createProgress(storage);
    progress.markViewed('b');
    progress.markViewed('a');
    progress.markViewed('c');
    expect(progress.viewed()).toEqual(['b', 'a', 'c']);
  });

  it('clears', () => {
    const progress = createProgress(storage);
    progress.markViewed('a');
    progress.reset();
    expect(progress.count()).toBe(0);
    expect(createProgress(storage).count()).toBe(0);
  });

  it('ignores stored rubbish instead of breaking the gallery', () => {
    for (const junk of ['not json', '{"a":1}', '"string"', '[1,2,{}]', 'null']) {
      const progress = createProgress(memoryStorage({ [STORAGE_KEY]: junk }));
      expect(progress.viewed().every((v) => typeof v === 'string')).toBe(true);
    }
  });

  it('works when storage is unavailable or throws', () => {
    const hostile = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    const progress = createProgress(hostile);
    expect(() => progress.markViewed('a')).not.toThrow();
    expect(progress.has('a')).toBe(true);

    const none = createProgress(null);
    expect(() => none.markViewed('a')).not.toThrow();
    expect(none.count()).toBe(1);
  });

  it('notifies a subscriber when something new is seen', () => {
    const progress = createProgress(storage);
    const listener = vi.fn();
    progress.subscribe(listener);
    progress.markViewed('a');
    progress.markViewed('a');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
