/**
 * The information panel that arrives with you when you reach a work.
 *
 * Right-hand column on a desktop, bottom sheet on a phone — the same markup,
 * placed differently by CSS.
 */

import { artistsById } from '../data/artists.js';
import { inquiryLink } from '../data/site.js';
import { formatDimensions, formatPrice, similarWorks, worksByArtist } from '../data/works.js';
import { clear, el, thumbnail } from './dom.js';

export function createPanel({ root, onArtist, onWork, onClose }) {
  let current = null;

  function render(work) {
    const artist = artistsById[work.artistId];
    const more = worksByArtist(work.artistId).filter((w) => w.id !== work.id);
    const similar = similarWorks(work);

    clear(root);
    root.append(
      el('button', {
        class: 'panel__close',
        type: 'button',
        'aria-label': 'Close',
        text: '×',
        onclick: () => onClose?.(),
      }),

      el('div', { class: 'panel__scroll' }, [
        el('button', {
          class: 'panel__artist',
          type: 'button',
          text: artist?.name ?? 'Unknown artist',
          onclick: () => onArtist?.(work.artistId),
        }),

        el('h2', { class: 'panel__title', text: work.title }),
        el('p', { class: 'panel__year', text: String(work.year) }),

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
          ? el('p', {
              class: 'panel__note',
              text: 'This work has found a home. Ask us about others in the series.',
            })
          : el('a', {
              class: 'btn btn--primary panel__inquire',
              href: inquiryLink(work, artist?.name ?? ''),
              text: work.status === 'reserved' ? 'Join the waiting list' : 'Inquire',
            }),

        more.length
          ? el('section', { class: 'panel__section' }, [
              el('h3', { text: `More by ${artist?.name ?? 'this artist'}` }),
              el(
                'div',
                { class: 'thumbs' },
                more.map((w) => thumbnail(w, (picked) => onWork?.(picked))),
              ),
            ])
          : null,

        similar.length
          ? el('section', { class: 'panel__section' }, [
              el('h3', { text: 'Similar works' }),
              el(
                'div',
                { class: 'thumbs' },
                similar.map((w) => thumbnail(w, (picked) => onWork?.(picked))),
              ),
            ])
          : null,
      ]),
    );
  }

  return {
    get work() {
      return current;
    },

    show(work) {
      current = work;
      render(work);
      root.hidden = false;
      // Next frame, so the transition has a starting state to animate from.
      requestAnimationFrame(() => root.classList.add('is-open'));
    },

    hide() {
      current = null;
      root.classList.remove('is-open');
      const done = () => {
        if (!root.classList.contains('is-open')) root.hidden = true;
      };
      root.addEventListener('transitionend', done, { once: true });
      setTimeout(done, 400); // in case the transition never fires
    },
  };
}
