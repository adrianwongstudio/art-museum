/**
 * The standing pages, and the switch between them and the room.
 *
 * A page replaces the room rather than floating over it: the canvas is hidden
 * and rendering stops while one is open, so a visitor reading about opening
 * hours is not paying for a 3D gallery to be drawn behind the text.
 */

import { renderArtistsPage } from './artists.js';
import { renderArtworksPage } from './artworks.js';
import { renderContactPage } from './contact.js';
import { clear } from '../dom.js';

export const PAGE_TITLES = {
  artists: 'Artists',
  artworks: 'Artwork',
  contact: 'Contact',
};

export function createPages({ root, handlers }) {
  let current = null;

  const builders = {
    artists: () =>
      renderArtistsPage({
        onArtist: handlers.onArtist,
        onMedium: handlers.onMedium,
      }),
    artworks: (options = {}) => renderArtworksPage({ onWork: handlers.onWork, ...options }),
    contact: () => renderContactPage(),
  };

  return {
    get current() {
      return current;
    },

    /** @param {'artists'|'artworks'|'contact'} name */
    show(name, options) {
      const build = builders[name];
      if (!build) return false;

      clear(root);
      root.append(build(options));
      root.hidden = false;
      document.body.classList.add('is-page');
      current = name;

      // A new page starts at the top, the way a new page does.
      root.scrollTop = 0;
      window.scrollTo(0, 0);
      return true;
    },

    hide() {
      if (!current) return;
      current = null;
      root.hidden = true;
      clear(root);
      document.body.classList.remove('is-page');
    },
  };
}
