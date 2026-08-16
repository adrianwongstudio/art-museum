/**
 * The gallery as a document.
 *
 * Always rendered, so search engines and screen readers get the whole exhibition
 * as ordinary HTML. Hidden behind the canvas when the 3D room is running, and
 * promoted to the visible page when WebGL is unavailable.
 */

import { artists, artistsById } from '../data/artists.js';
import { hangings, sculpture } from '../data/gallery.js';
import { inquiryLink, site } from '../data/site.js';
import { formatDimensions, formatPrice, getWork, works } from '../data/works.js';
import { el } from './dom.js';

function entry(work, { wall } = {}) {
  const artist = artistsById[work.artistId];

  return el('article', { class: 'entry' }, [
    el('img', { class: 'entry__image', src: work.image, alt: `${work.title} by ${artist?.name}`, loading: 'lazy' }),
    el('div', { class: 'entry__body' }, [
      el('h3', { class: 'entry__title' }, [
        el('span', { text: work.title }),
        el('span', { class: 'entry__year', text: ` (${work.year})` }),
      ]),
      el('p', { class: 'entry__artist', text: artist?.name ?? '' }),
      el('p', {
        class: 'entry__meta',
        text: [work.medium, formatDimensions(work), wall ? `${wall} wall` : null]
          .filter(Boolean)
          .join(' · '),
      }),
      el('p', { class: 'entry__price', text: formatPrice(work) }),
      el('p', { class: 'entry__description', text: work.description }),
      work.status === 'sold'
        ? null
        : el('a', { class: 'entry__inquire', href: inquiryLink(work, artist?.name ?? ''), text: 'Inquire about this work' }),
    ]),
  ]);
}

export function renderFallback(root, { webgl }) {
  const centrepiece = getWork(sculpture.workId);

  root.append(
    el('header', { class: 'fallback__header' }, [
      el('h1', { text: site.name }),
      el('p', { class: 'fallback__tagline', text: site.tagline }),
      webgl
        ? null
        : el('p', {
            class: 'fallback__notice',
            text: 'Your browser cannot run the walk-through gallery, so here is the whole exhibition as a catalogue.',
          }),
    ]),

    el('section', {}, [
      el('h2', { text: 'In the room' }),
      ...hangings.map((h) => entry(h.work, { wall: h.wall })),
      centrepiece ? entry(centrepiece, { wall: 'centre' }) : null,
    ]),

    el('section', {}, [
      el('h2', { text: 'The artists' }),
      ...artists.map((artist) =>
        el('article', { class: 'entry entry--artist' }, [
          el('h3', { text: artist.name }),
          el('p', { class: 'entry__meta', text: `b. ${artist.born} · ${artist.location}` }),
          el('p', { text: artist.bio }),
        ]),
      ),
    ]),

    el('section', {}, [
      el('h2', { text: 'Full catalogue' }),
      el(
        'ul',
        { class: 'catalogue' },
        works.map((work) =>
          el('li', {}, [
            el('span', { class: 'catalogue__title', text: work.title }),
            ` — ${artistsById[work.artistId]?.name ?? ''}, ${work.year} · ${formatPrice(work)}`,
          ]),
        ),
      ),
    ]),

    el('footer', { class: 'fallback__footer' }, [
      el('p', {}, [
        'Enquiries: ',
        el('a', { href: `mailto:${site.email}`, text: site.email }),
        ` · ${site.location}`,
      ]),
    ]),
  );
}
