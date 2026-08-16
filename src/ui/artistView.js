/**
 * The artist overlay: who made this, and what else they have here.
 */

import { artistsById } from '../data/artists.js';
import { formatDimensions, formatPrice, worksByArtist } from '../data/works.js';
import { clear, el } from './dom.js';
import { trapFocus } from './focus.js';

export function createArtistView({ root, onWork, onClose }) {
  function card(work) {
    return el(
      'button',
      {
        class: 'workcard',
        type: 'button',
        onclick: () => onWork?.(work),
      },
      [
        el('span', { class: 'workcard__frame' }, [el('img', { src: work.image, alt: '', loading: 'lazy' })]),
        el('span', { class: 'workcard__title', text: work.title }),
        el('span', { class: 'workcard__meta', text: `${work.year} · ${formatDimensions(work)}` }),
        el('span', { class: `price price--${work.status}`, text: formatPrice(work) }),
      ],
    );
  }

  let releaseFocus = null;

  return {
    show(artistId) {
      const artist = artistsById[artistId];
      if (!artist) return;

      clear(root);
      root.append(
        el('div', { class: 'overlay__sheet' }, [
          el('button', {
            class: 'overlay__close',
            type: 'button',
            'aria-label': 'Close',
            text: '×',
            onclick: () => onClose?.(),
          }),

          el('header', { class: 'artist__header' }, [
            el('p', { class: 'eyebrow', text: 'Artist' }),
            el('h2', { class: 'artist__name', text: artist.name }),
            el('p', { class: 'artist__facts', text: `b. ${artist.born} · ${artist.location}` }),
          ]),

          el('blockquote', { class: 'artist__statement', text: artist.statement }),
          el('p', { class: 'artist__bio', text: artist.bio }),

          el('h3', { class: 'artist__subhead', text: 'Works' }),
          el(
            'div',
            { class: 'workgrid' },
            worksByArtist(artistId).map(card),
          ),
        ]),
      );

      root.hidden = false;
      requestAnimationFrame(() => root.classList.add('is-open'));
      releaseFocus?.();
      releaseFocus = trapFocus(root);
      root.querySelector('.overlay__close')?.focus();
    },

    hide() {
      releaseFocus?.();
      releaseFocus = null;
      root.classList.remove('is-open');
      const done = () => {
        if (!root.classList.contains('is-open')) root.hidden = true;
      };
      root.addEventListener('transitionend', done, { once: true });
      setTimeout(done, 400);
    },

    get open() {
      return !root.hidden;
    },
  };
}
