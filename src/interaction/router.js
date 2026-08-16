/**
 * Hash routing, so a visitor can send someone a link to a particular work.
 *
 *   #/artwork/<slug>   the room, standing in front of that work
 *   #/artist/<id>      the artist overlay
 *   #/                 the room
 *
 * Anything unrecognised resolves to the room rather than an error: a bad link
 * should still open the gallery.
 */

const ROOM = { route: 'room' };

function decode(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment; // malformed encoding — better a strange slug than a crash
  }
}

export function parseHash(hash) {
  if (typeof hash !== 'string') return ROOM;

  const segments = hash
    .replace(/^#/, '')
    .split('/')
    .filter(Boolean)
    .map(decode);

  if (segments.length < 2) return ROOM;

  const [route, value] = segments;
  if (route === 'artwork') return { route: 'artwork', slug: value };
  if (route === 'artist') return { route: 'artist', id: value };
  return ROOM;
}

export const artworkHash = (slug) => `#/artwork/${encodeURIComponent(slug)}`;
export const artistHash = (id) => `#/artist/${encodeURIComponent(id)}`;
export const roomHash = () => '#/';

/**
 * Replace the hash without adding a history entry and without provoking our own
 * hashchange handler — used when arriving somewhere the visitor navigated to in 3D.
 */
export function replaceHash(hash, { window: win = globalThis.window } = {}) {
  if (!win?.history?.replaceState) {
    if (win) win.location.hash = hash;
    return;
  }
  const url = `${win.location.pathname}${win.location.search}${hash}`;
  win.history.replaceState(win.history.state, '', url);
}
