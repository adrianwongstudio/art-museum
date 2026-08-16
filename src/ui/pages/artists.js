/**
 * The artists page, laid out the way art.com/shop/artists is: a featured banner,
 * then sections that each announce themselves with a centred heading and a line
 * of explanation, then a grid of cards that are an image with a name under it.
 *
 * Where that page has thousands of artists and groups them by school, this one
 * has four, so the sections are ones our catalogue can honestly fill — who is
 * hanging, and what they work in.
 */

import { artists } from '../../data/artists.js';
import { hangings } from '../../data/gallery.js';
import { formatPrice, worksByArtist } from '../../data/works.js';
import { mediumOf } from '../../interaction/filters.js';
import { el } from '../dom.js';

/** The work that best represents an artist: the one hanging, or their newest. */
function coverWork(artistId) {
  const hung = hangings.find((hanging) => hanging.work.artistId === artistId);
  if (hung) return hung.work;
  return [...worksByArtist(artistId)].sort((a, b) => b.year - a.year)[0];
}

function artistCard(artist, onArtist) {
  const cover = coverWork(artist.id);
  const count = worksByArtist(artist.id).length;
  const hungCount = hangings.filter((h) => h.work.artistId === artist.id).length;

  return el(
    'button',
    {
      class: 'artistcard',
      type: 'button',
      onclick: () => onArtist(artist.id),
    },
    [
      el('span', { class: 'artistcard__image' }, [
        el('img', { src: cover.image, alt: `${cover.title} by ${artist.name}`, loading: 'lazy' }),
      ]),
      el('span', { class: 'artistcard__name', text: artist.name }),
      el('span', {
        class: 'artistcard__meta',
        text: `${count} works · ${hungCount} in the room`,
      }),
    ],
  );
}

function section(title, blurb, children) {
  return el('section', { class: 'shopsection' }, [
    el('h2', { class: 'shopsection__title', text: title }),
    blurb ? el('p', { class: 'shopsection__blurb', text: blurb }) : null,
    ...[].concat(children),
  ]);
}

/** A card for a medium, standing in for art.com's "browse by school" rows. */
function mediumCard(medium, list, onMedium) {
  const cover = [...list].sort((a, b) => b.year - a.year)[0];
  return el(
    'button',
    { class: 'artistcard', type: 'button', onclick: () => onMedium(medium) },
    [
      el('span', { class: 'artistcard__image' }, [
        el('img', { src: cover.image, alt: '', loading: 'lazy' }),
      ]),
      el('span', { class: 'artistcard__name', text: medium }),
      el('span', { class: 'artistcard__meta', text: `${list.length} works` }),
    ],
  );
}

export function renderArtistsPage({ onArtist, onMedium }) {
  const byMedium = new Map();
  for (const artist of artists) {
    for (const work of worksByArtist(artist.id)) {
      const medium = mediumOf(work);
      byMedium.set(medium, [...(byMedium.get(medium) ?? []), work]);
    }
  }

  const roster = [...artists].sort((a, b) => a.name.localeCompare(b.name));

  return el('div', { class: 'page page--artists' }, [
    el('div', { class: 'banner' }, [
      el('div', { class: 'banner__text' }, [
        el('h1', { class: 'banner__title', text: 'Featured Artists' }),
        el('p', {
          class: 'banner__blurb',
          text: 'Four painters and makers, shown together for the first time. Everything here was made for a room of this size.',
        }),
      ]),
      el('div', { class: 'banner__art' }, [
        el('img', { src: coverWork(artists[0].id).image, alt: '', loading: 'lazy' }),
      ]),
    ]),

    section(
      'Exhibiting Artists',
      'The four hands behind the current hang. Open one to read their statement and see everything they have with us.',
      el(
        'div',
        { class: 'cardgrid' },
        roster.map((artist) => artistCard(artist, onArtist)),
      ),
    ),

    section(
      'Browse by Medium',
      'What the work is actually made of — the surest way to find more like something you already liked.',
      el(
        'div',
        { class: 'cardgrid' },
        [...byMedium.entries()]
          .sort((a, b) => b[1].length - a[1].length)
          .map(([medium, list]) => mediumCard(medium, list, onMedium)),
      ),
    ),

    section(
      'All Artists, A–Z',
      null,
      el(
        'ul',
        { class: 'azlist' },
        roster.map((artist) =>
          el('li', {}, [
            el('button', {
              class: 'azlist__name',
              type: 'button',
              text: artist.name,
              onclick: () => onArtist(artist.id),
            }),
            el('span', {
              class: 'azlist__meta',
              text: `${artist.location} · from ${formatPrice(
                [...worksByArtist(artist.id)].sort((a, b) => a.price - b.price)[0],
              )}`,
            }),
          ]),
        ),
      ),
    ),
  ]);
}
