/**
 * A detail view for work that is not hanging in this room — there is nowhere to
 * walk to, so it is shown flat.
 */

import { artistsById } from '../data/artists.js';
import { inquiryLink } from '../data/site.js';
import { formatDimensions, formatPrice } from '../data/works.js';
import { clear, el } from './dom.js';

export function createLightbox({ root, onArtist, onClose }) {
  return {
    show(work) {
      const artist = artistsById[work.artistId];

      clear(root);
      root.append(
        el('div', { class: 'overlay__sheet overlay__sheet--wide' }, [
          el('button', {
            class: 'overlay__close',
            type: 'button',
            'aria-label': 'Close',
            text: '×',
            onclick: () => onClose?.(),
          }),

          el('div', { class: 'lightbox' }, [
            el('div', { class: 'lightbox__image' }, [el('img', { src: work.image, alt: work.title })]),

            el('div', { class: 'lightbox__detail' }, [
              el('button', {
                class: 'panel__artist',
                type: 'button',
                text: artist?.name ?? '',
                onclick: () => onArtist?.(work.artistId),
              }),
              el('h2', { class: 'panel__title', text: work.title }),
              el('p', { class: 'panel__year', text: `${work.year} · not on display in this room` }),

              el('dl', { class: 'panel__meta' }, [
                el('dt', { text: 'Medium' }),
                el('dd', { text: work.medium }),
                el('dt', { text: 'Dimensions' }),
                el('dd', { text: formatDimensions(work) }),
                el('dt', { text: 'Price' }),
                el('dd', {}, [
                  el('span', { class: `price price--${work.status}`, text: formatPrice(work) }),
                ]),
              ]),

              el('p', { class: 'panel__description', text: work.description }),

              work.status === 'sold'
                ? el('p', { class: 'panel__note', text: 'This work has been sold.' })
                : el('a', {
                    class: 'btn btn--primary',
                    href: inquiryLink(work, artist?.name ?? ''),
                    text: 'Inquire',
                  }),
            ]),
          ]),
        ]),
      );

      root.hidden = false;
      requestAnimationFrame(() => root.classList.add('is-open'));
      root.querySelector('.overlay__close')?.focus();
    },

    hide() {
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
