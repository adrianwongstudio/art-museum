/**
 * Hash routing, for the standing pages and for links into the room itself.
 *
 *   #/                 the room
 *   #/artists          the artists page
 *   #/artwork          the artwork page
 *   #/contact          the contact page
 *   #/artwork/<slug>   the room, standing in front of that work
 *   #/artist/<id>      the room, with the artist overlay open
 *
 * The plural, single-segment routes are pages; the singular two-segment ones
 * point into the room. That is the whole distinction, and it is why `#/artwork`
 * and `#/artwork/gulf-weather` mean different things.
 *
 * Anything unrecognised resolves to the room rather than an error: a bad link
 * should still open the gallery.
 */

const ROOM = { route: 'room' };

/** Standing pages, by the segment that names them in a URL. */
const PAGES = {
  artists: 'artists',
  artwork: 'artworks',
  contact: 'contact',
};

/** The reverse: a route name back to the segment a visitor sees. */
const PAGE_SEGMENTS = Object.fromEntries(
  Object.entries(PAGES).map(([segment, route]) => [route, segment]),
);

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

  if (segments.length === 1) {
    const page = PAGES[segments[0]];
    return page ? { route: page } : ROOM;
  }

  if (segments.length < 2) return ROOM;

  const [route, value] = segments;
  if (route === 'artwork') return { route: 'artwork', slug: value };
  if (route === 'artist') return { route: 'artist', id: value };
  return ROOM;
}

export const artworkHash = (slug) => `#/artwork/${encodeURIComponent(slug)}`;
export const artistHash = (id) => `#/artist/${encodeURIComponent(id)}`;
export const roomHash = () => '#/';

/** @param {'artists'|'artworks'|'contact'} route */
export const pageHash = (route) =>
  PAGE_SEGMENTS[route] ? `#/${PAGE_SEGMENTS[route]}` : roomHash();

export const contactHash = () => pageHash('contact');

/** True for the routes that replace the room with a page. */
export const isPageRoute = (route) => Object.values(PAGES).includes(route);

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
