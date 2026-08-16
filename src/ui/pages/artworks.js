/**
 * The artwork page: browse the whole catalogue, in the shape an art-marketplace
 * browse page takes — a filter rail down the left, a toolbar saying what is
 * showing and how it is sorted, and a grid of works that lead their card with
 * the artist's name.
 *
 * The filtering itself is in interaction/filters.js, where it can be tested. This
 * module is the page: inputs, grid, and keeping the two in step.
 */

import { artists, artistsById } from '../../data/artists.js';
import { isHung } from '../../data/gallery.js';
import { formatDimensions, formatPrice, works } from '../../data/works.js';
import {
  DEFAULT_CRITERIA,
  SORTS,
  filterWorks,
  mediumOf,
  mediums,
  priceBounds,
  sortWorks,
  summarise,
} from '../../interaction/filters.js';
import { clear, el } from '../dom.js';

const STATUSES = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'sold', label: 'Sold' },
];

function workCard(work, onWork) {
  const artist = artistsById[work.artistId];
  const hung = isHung(work.id);

  return el(
    'button',
    {
      class: 'worktile',
      type: 'button',
      onclick: () => onWork(work),
      title: hung ? 'Walk up to this work in the room' : 'See this work',
    },
    [
      el('span', { class: 'worktile__image' }, [
        el('img', { src: work.image, alt: `${work.title} by ${artist?.name ?? ''}`, loading: 'lazy' }),
        hung ? el('span', { class: 'worktile__badge', text: 'In the room' }) : null,
      ]),
      el('span', { class: 'worktile__artist', text: artist?.name ?? '' }),
      el('span', { class: 'worktile__title' }, [
        el('em', { text: work.title }),
        el('span', { text: `, ${work.year}` }),
      ]),
      el('span', { class: 'worktile__medium', text: `${work.medium} · ${formatDimensions(work)}` }),
      el('span', { class: `worktile__price price price--${work.status}`, text: formatPrice(work) }),
    ],
  );
}

function checkboxGroup({ legend, options, chosen, onChange }) {
  return el('fieldset', { class: 'facet' }, [
    el('legend', { class: 'facet__legend', text: legend }),
    ...options.map(({ value, label, count }) =>
      el('label', { class: 'facet__option' }, [
        el('input', {
          type: 'checkbox',
          value,
          checked: chosen.includes(value),
          onchange: (event) => {
            const next = event.target.checked
              ? [...chosen, value]
              : chosen.filter((v) => v !== value);
            onChange(next);
          },
        }),
        el('span', { class: 'facet__label', text: label }),
        count === undefined ? null : el('span', { class: 'facet__count', text: String(count) }),
      ]),
    ),
  ]);
}

export function renderArtworksPage({ onWork, initialCriteria = {} }) {
  const criteria = { ...DEFAULT_CRITERIA, ...initialCriteria };
  let sort = 'recent';

  const bounds = priceBounds(works);
  const grid = el('div', { class: 'worksgrid' });
  const count = el('p', { class: 'toolbar__count' });
  const rail = el('form', { class: 'rail', onsubmit: (event) => event.preventDefault() });

  const countBy = (predicate) => works.filter(predicate).length;

  function refresh() {
    const matched = sortWorks(
      filterWorks(works, criteria, { artistName: (id) => artistsById[id]?.name ?? '' }),
      sort,
    );

    count.textContent = summarise(matched.length, works.length);
    clear(grid);

    if (!matched.length) {
      grid.append(
        el('p', { class: 'worksgrid__empty' }, [
          'Nothing matches that combination. ',
          el('button', {
            class: 'linkbutton',
            type: 'button',
            text: 'Clear the filters',
            onclick: () => {
              Object.assign(criteria, DEFAULT_CRITERIA, { artists: [], mediums: [], statuses: [] });
              buildRail();
              refresh();
            },
          }),
        ]),
      );
      return;
    }

    for (const work of matched) grid.append(workCard(work, onWork));
  }

  function update(patch) {
    Object.assign(criteria, patch);
    refresh();
  }

  function buildRail() {
    clear(rail);
    rail.append(
      el('div', { class: 'rail__head' }, [
        el('h2', { class: 'rail__title', text: 'Filter' }),
        el('button', {
          class: 'linkbutton',
          type: 'button',
          text: 'Clear all',
          onclick: () => {
            Object.assign(criteria, DEFAULT_CRITERIA, { artists: [], mediums: [], statuses: [] });
            buildRail();
            refresh();
          },
        }),
      ]),

      el('label', { class: 'facet facet--search' }, [
        el('span', { class: 'facet__legend', text: 'Search' }),
        el('input', {
          type: 'search',
          placeholder: 'Title, artist, medium',
          value: criteria.query,
          oninput: (event) => update({ query: event.target.value }),
        }),
      ]),

      checkboxGroup({
        legend: 'Artist',
        chosen: criteria.artists,
        options: artists.map((artist) => ({
          value: artist.id,
          label: artist.name,
          count: countBy((work) => work.artistId === artist.id),
        })),
        onChange: (next) => update({ artists: next }),
      }),

      checkboxGroup({
        legend: 'Medium',
        chosen: criteria.mediums,
        options: mediums(works).map((medium) => ({
          value: medium,
          label: medium,
          count: countBy((work) => mediumOf(work) === medium),
        })),
        onChange: (next) => update({ mediums: next }),
      }),

      checkboxGroup({
        legend: 'Availability',
        chosen: criteria.statuses,
        options: STATUSES.map(({ value, label }) => ({
          value,
          label,
          count: countBy((work) => work.status === value),
        })),
        onChange: (next) => update({ statuses: next }),
      }),

      el('fieldset', { class: 'facet' }, [
        el('legend', { class: 'facet__legend', text: 'Price' }),
        el('div', { class: 'facet__range' }, [
          el('label', {}, [
            el('span', { class: 'facet__small', text: 'Min' }),
            el('input', {
              type: 'number',
              min: String(bounds.min),
              max: String(bounds.max),
              step: '100',
              placeholder: String(bounds.min),
              value: criteria.minPrice ?? '',
              oninput: (event) =>
                update({ minPrice: event.target.value === '' ? null : Number(event.target.value) }),
            }),
          ]),
          el('label', {}, [
            el('span', { class: 'facet__small', text: 'Max' }),
            el('input', {
              type: 'number',
              min: String(bounds.min),
              max: String(bounds.max),
              step: '100',
              placeholder: String(bounds.max),
              value: criteria.maxPrice ?? '',
              oninput: (event) =>
                update({ maxPrice: event.target.value === '' ? null : Number(event.target.value) }),
            }),
          ]),
        ]),
        el('p', {
          class: 'facet__small',
          text: `The collection runs ${formatPrice({ price: bounds.min, status: 'available' })} to ${formatPrice({ price: bounds.max, status: 'available' })}.`,
        }),
      ]),
    );
  }

  buildRail();
  refresh();

  return el('div', { class: 'page page--works' }, [
    el('header', { class: 'pagehead' }, [
      el('p', { class: 'eyebrow', text: 'Collection' }),
      el('h1', { class: 'pagehead__title', text: 'Artwork' }),
      el('p', {
        class: 'pagehead__lede',
        text: 'Everything the gallery holds, including work not currently on the walls. Anything hanging in the room can be walked up to.',
      }),
    ]),

    el('div', { class: 'browse' }, [
      rail,
      el('div', { class: 'browse__main' }, [
        el('div', { class: 'toolbar' }, [
          count,
          el('label', { class: 'toolbar__sort' }, [
            el('span', { text: 'Sort' }),
            el(
              'select',
              {
                onchange: (event) => {
                  sort = event.target.value;
                  refresh();
                },
              },
              SORTS.map(({ value, label }) => el('option', { value, text: label })),
            ),
          ]),
        ]),
        grid,
      ]),
    ]),
  ]);
}
