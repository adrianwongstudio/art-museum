import { describe, expect, it, vi } from 'vitest';

import { THEME_STORAGE_KEY, createTheme, otherTheme, resolveInitialTheme } from '../src/ui/theme.js';

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    _map: map,
  };
}

/** A stand-in for window.matchMedia that answers one query. */
function prefers(dark) {
  return (query) => ({ matches: query.includes('dark') ? dark : !dark, media: query });
}

describe('resolveInitialTheme', () => {
  it('uses a stored choice above everything else', () => {
    const storage = memoryStorage({ [THEME_STORAGE_KEY]: 'dark' });
    expect(resolveInitialTheme({ storage, matchMedia: prefers(false) })).toBe('dark');

    const light = memoryStorage({ [THEME_STORAGE_KEY]: 'light' });
    expect(resolveInitialTheme({ storage: light, matchMedia: prefers(true) })).toBe('light');
  });

  it('falls back to what the system asks for', () => {
    expect(resolveInitialTheme({ storage: memoryStorage(), matchMedia: prefers(true) })).toBe('dark');
    expect(resolveInitialTheme({ storage: memoryStorage(), matchMedia: prefers(false) })).toBe('light');
  });

  it('lands on light when nothing has an opinion', () => {
    expect(resolveInitialTheme({ storage: memoryStorage(), matchMedia: null })).toBe('light');
    expect(resolveInitialTheme({})).toBe('light');
  });

  it('ignores a stored value that is not a theme', () => {
    const storage = memoryStorage({ [THEME_STORAGE_KEY]: 'aubergine' });
    expect(resolveInitialTheme({ storage, matchMedia: prefers(true) })).toBe('dark');
  });

  it('survives storage that throws', () => {
    const hostile = {
      getItem() {
        throw new Error('denied');
      },
      setItem() {
        throw new Error('denied');
      },
    };
    expect(resolveInitialTheme({ storage: hostile, matchMedia: prefers(true) })).toBe('dark');
  });
});

describe('otherTheme', () => {
  it('flips', () => {
    expect(otherTheme('light')).toBe('dark');
    expect(otherTheme('dark')).toBe('light');
  });

  it('treats anything unexpected as light, so the toggle still goes dark', () => {
    expect(otherTheme('nonsense')).toBe('dark');
  });
});

describe('createTheme', () => {
  it('starts from the resolved theme', () => {
    const storage = memoryStorage({ [THEME_STORAGE_KEY]: 'dark' });
    expect(createTheme({ storage, matchMedia: prefers(false) }).current).toBe('dark');
  });

  it('toggles and reports the new theme', () => {
    const theme = createTheme({ storage: memoryStorage(), matchMedia: prefers(false) });
    expect(theme.toggle()).toBe('dark');
    expect(theme.current).toBe('dark');
    expect(theme.toggle()).toBe('light');
  });

  it('remembers the choice for the next visit', () => {
    const storage = memoryStorage();
    createTheme({ storage, matchMedia: prefers(false) }).toggle();
    expect(storage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(createTheme({ storage, matchMedia: prefers(false) }).current).toBe('dark');
  });

  it('tells subscribers, immediately and on every change', () => {
    const theme = createTheme({ storage: memoryStorage(), matchMedia: prefers(false) });
    const listener = vi.fn();

    theme.subscribe(listener);
    expect(listener).toHaveBeenCalledWith('light');

    theme.toggle();
    expect(listener).toHaveBeenCalledWith('dark');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('does not tell anyone when the theme has not actually changed', () => {
    const theme = createTheme({ storage: memoryStorage(), matchMedia: prefers(false) });
    const listener = vi.fn();
    theme.subscribe(listener);
    listener.mockClear();

    theme.set('light');
    expect(listener).not.toHaveBeenCalled();
  });

  it('refuses a theme it does not have', () => {
    const theme = createTheme({ storage: memoryStorage(), matchMedia: prefers(false) });
    theme.set('aubergine');
    expect(theme.current).toBe('light');
  });

  it('keeps working when storage refuses to remember', () => {
    const hostile = {
      getItem: () => null,
      setItem() {
        throw new Error('denied');
      },
    };
    const theme = createTheme({ storage: hostile, matchMedia: prefers(false) });
    expect(() => theme.toggle()).not.toThrow();
    expect(theme.current).toBe('dark');
  });

  it('unsubscribes', () => {
    const theme = createTheme({ storage: memoryStorage(), matchMedia: prefers(false) });
    const listener = vi.fn();
    const off = theme.subscribe(listener);
    listener.mockClear();
    off();
    theme.toggle();
    expect(listener).not.toHaveBeenCalled();
  });
});
