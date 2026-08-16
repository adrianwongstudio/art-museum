/**
 * Which way the lights are set.
 *
 * A visitor's own choice outranks their system preference, which outranks the
 * white cube default. The choice is remembered, but never at the cost of the
 * gallery working: blocked or hostile storage degrades to a per-session choice.
 *
 * Pure state. Painting the page and the room is main.js's business, through
 * subscribers.
 */

/** Also hardcoded in the inline no-flash script in index.html. Keep them equal. */
export const THEME_STORAGE_KEY = 'the-long-room:theme';

const THEMES = ['light', 'dark'];
const isTheme = (value) => THEMES.includes(value);

function stored(storage) {
  try {
    const value = storage?.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

function remember(storage, theme) {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The gallery still switches; it just will not be remembered next time.
  }
}

function systemPrefers(matchMedia) {
  try {
    return matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : null;
  } catch {
    return null;
  }
}

export function resolveInitialTheme({
  storage = globalThis.localStorage,
  matchMedia = globalThis.matchMedia?.bind(globalThis),
} = {}) {
  return stored(storage) ?? systemPrefers(matchMedia) ?? 'light';
}

export function otherTheme(theme) {
  return theme === 'dark' ? 'light' : 'dark';
}

export function createTheme(options = {}) {
  const { storage = globalThis.localStorage } = options;
  const listeners = new Set();
  let current = resolveInitialTheme(options);

  function set(theme) {
    if (!isTheme(theme) || theme === current) return current;
    current = theme;
    remember(storage, current);
    listeners.forEach((listener) => listener(current));
    return current;
  }

  return {
    get current() {
      return current;
    },

    set,
    toggle: () => set(otherTheme(current)),

    /** Called straight away with the current theme, then on every change. */
    subscribe(listener) {
      listeners.add(listener);
      listener(current);
      return () => listeners.delete(listener);
    },
  };
}
