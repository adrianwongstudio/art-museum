/**
 * Every work in the exhibition's catalogue.
 *
 * Eight of these hang in the room (see gallery.js); the rest exist so that "more by
 * this artist" and "similar works" have somewhere to go.
 *
 * PLACEHOLDER CONTENT. `image` points at a generated SVG. To use a real photograph,
 * drop it in public/artworks/ and change the path — nothing else needs to change.
 *
 * dimensions are in METRES and are used verbatim to size the canvas in 3D, so they
 * must be honest: a work listed at 1.8 m tall will be 1.8 m tall on the wall.
 * price is in USD. `status` is one of available | reserved | sold.
 */

export const works = [
  // ── Mireille Okonkwo ────────────────────────────────────────────────────────
  {
    id: 'w-okonkwo-1',
    slug: 'doorway-for-a-warm-month',
    title: 'Doorway for a Warm Month',
    artistId: 'okonkwo',
    year: 2024,
    medium: 'Acrylic on canvas',
    dimensions: { w: 1.3, h: 1.8 },
    price: 14500,
    status: 'available',
    tags: ['geometry', 'colour', 'architecture'],
    description:
      'Four bands of colour meeting at hard edges, sized so a standing viewer reads it the way they would read a doorway — bottom first, then up. The seam down the centre was repainted eleven times.',
    image: './artworks/doorway-for-a-warm-month.svg',
  },
  {
    id: 'w-okonkwo-2',
    slug: 'two-thirds-of-an-afternoon',
    title: 'Two Thirds of an Afternoon',
    artistId: 'okonkwo',
    year: 2023,
    medium: 'Acrylic on canvas',
    dimensions: { w: 1.6, h: 1.1 },
    price: 11000,
    status: 'available',
    tags: ['geometry', 'colour', 'light'],
    description:
      'A horizontal work in which the upper field is very slightly warmer than the lower one. Okonkwo has said the difference is the whole painting.',
    image: './artworks/two-thirds-of-an-afternoon.svg',
  },
  {
    id: 'w-okonkwo-3',
    slug: 'red-does-not-arrive',
    title: 'Red Does Not Arrive',
    artistId: 'okonkwo',
    year: 2022,
    medium: 'Acrylic on linen',
    dimensions: { w: 0.9, h: 1.2 },
    price: 8200,
    status: 'sold',
    tags: ['geometry', 'colour'],
    description:
      'Every band in this painting is a step toward a red that the composition stops short of reaching.',
    image: './artworks/red-does-not-arrive.svg',
  },
  {
    id: 'w-okonkwo-4',
    slug: 'window-tax',
    title: 'Window Tax',
    artistId: 'okonkwo',
    year: 2021,
    medium: 'Acrylic on canvas',
    dimensions: { w: 1.0, h: 1.0 },
    price: 7600,
    status: 'available',
    tags: ['geometry', 'architecture'],
    description:
      'A square divided into nine unequal rectangles, four of which are bricked up in the same grey as the wall behind them.',
    image: './artworks/window-tax.svg',
  },
  {
    id: 'w-okonkwo-5',
    slug: 'lisbon-in-three-greys',
    title: 'Lisbon in Three Greys',
    artistId: 'okonkwo',
    year: 2025,
    medium: 'Acrylic on canvas',
    dimensions: { w: 1.4, h: 0.95 },
    price: 12800,
    status: 'reserved',
    tags: ['colour', 'architecture', 'monochrome'],
    description:
      'Painted after a winter of overcast mornings, using three greys mixed from the same two pigments in different proportions.',
    image: './artworks/lisbon-in-three-greys.svg',
  },

  // ── Tomás Reyes-Vidal ───────────────────────────────────────────────────────
  {
    id: 'w-reyes-1',
    slug: 'seed-that-refused',
    title: 'Seed That Refused',
    artistId: 'reyes-vidal',
    year: 2025,
    medium: 'Pigment on pressed paper pulp',
    dimensions: { w: 1.1, h: 1.5 },
    price: 9400,
    status: 'available',
    tags: ['organic', 'paper', 'texture'],
    description:
      'Pulp pressed while wet into a shallow mould, then worked with pigment before it could dry flat. The surface still holds the grain of the cloth it was pressed against.',
    image: './artworks/seed-that-refused.svg',
  },
  {
    id: 'w-reyes-2',
    slug: 'three-organs-for-weather',
    title: 'Three Organs for Weather',
    artistId: 'reyes-vidal',
    year: 2024,
    medium: 'Pigment and ash on paper pulp',
    dimensions: { w: 1.5, h: 1.15 },
    price: 10600,
    status: 'available',
    tags: ['organic', 'paper', 'figure', 'texture'],
    description:
      'Three soft masses arranged as though they had drifted into position rather than been placed. Reyes-Vidal made ten of these and destroyed seven.',
    image: './artworks/three-organs-for-weather.svg',
  },
  {
    id: 'w-reyes-3',
    slug: 'stone-with-a-pulse',
    title: 'Stone With a Pulse',
    artistId: 'reyes-vidal',
    year: 2023,
    medium: 'Pigment on paper pulp',
    dimensions: { w: 0.75, h: 0.95 },
    price: 5200,
    status: 'sold',
    tags: ['organic', 'texture'],
    description: 'A single form, off-centre, with a warmer core showing through the outer layer.',
    image: './artworks/stone-with-a-pulse.svg',
  },
  {
    id: 'w-reyes-4',
    slug: 'undecided-body',
    title: 'Undecided Body',
    artistId: 'reyes-vidal',
    year: 2022,
    medium: 'Pigment on paper pulp',
    dimensions: { w: 1.2, h: 1.2 },
    price: 6800,
    status: 'available',
    tags: ['organic', 'figure', 'paper'],
    description:
      'The form reads as a torso from across a room and as a river stone from arm’s length.',
    image: './artworks/undecided-body.svg',
  },
  {
    id: 'w-reyes-5',
    slug: 'nocturne-for-a-husk',
    title: 'Nocturne for a Husk',
    artistId: 'reyes-vidal',
    year: 2025,
    medium: 'Pigment and ash on paper pulp',
    dimensions: { w: 0.85, h: 1.3 },
    price: 7300,
    status: 'available',
    tags: ['organic', 'texture', 'memory'],
    description: 'The darkest work in the series, made with ash from the studio stove.',
    image: './artworks/nocturne-for-a-husk.svg',
  },

  {
    id: 'w-reyes-sculpture',
    slug: 'figure-for-an-empty-room',
    title: 'Figure for an Empty Room',
    artistId: 'reyes-vidal',
    year: 2025,
    medium: 'Papier-mâché over wire armature, pigment and wax',
    dimensions: { w: 0.9, h: 1.35 },
    price: 24000,
    status: 'available',
    tags: ['organic', 'paper', 'figure', 'texture'],
    description:
      'Built up in nineteen layers of torn paper over a wire frame, then sanded back in places until earlier layers show through. It was made for a room of this size and has never been shown in another.',
    image: './artworks/figure-for-an-empty-room.svg',
  },

  // ── Junko Halvorsen ─────────────────────────────────────────────────────────
  {
    id: 'w-halvorsen-1',
    slug: 'eleven-hours-of-ruling',
    title: 'Eleven Hours of Ruling',
    artistId: 'halvorsen',
    year: 2024,
    medium: 'Ink on paper',
    dimensions: { w: 1.05, h: 1.4 },
    price: 8900,
    status: 'available',
    tags: ['linework', 'monochrome', 'geometry'],
    description:
      'Ruled by hand in a single sitting. The lines drift measurably to the right as the hours pass, which Halvorsen considers the subject of the work.',
    image: './artworks/eleven-hours-of-ruling.svg',
  },
  {
    id: 'w-halvorsen-2',
    slug: 'grid-with-a-fault',
    title: 'Grid With a Fault',
    artistId: 'halvorsen',
    year: 2023,
    medium: 'Ink on paper',
    dimensions: { w: 1.45, h: 1.0 },
    price: 9800,
    status: 'available',
    tags: ['linework', 'geometry', 'architecture'],
    description:
      'A regular grid interrupted by a single displaced column, introduced after the drawing was two-thirds complete.',
    image: './artworks/grid-with-a-fault.svg',
  },
  {
    id: 'w-halvorsen-3',
    slug: 'three-inks-since-1998',
    title: 'Three Inks Since 1998',
    artistId: 'halvorsen',
    year: 2022,
    medium: 'Ink on paper',
    dimensions: { w: 0.8, h: 1.05 },
    price: 6100,
    status: 'reserved',
    tags: ['linework', 'monochrome'],
    description: 'The three inks Halvorsen has used for twenty-five years, in equal measure.',
    image: './artworks/three-inks-since-1998.svg',
  },
  {
    id: 'w-halvorsen-4',
    slug: 'oslo-january-grid',
    title: 'Oslo, January (Grid)',
    artistId: 'halvorsen',
    year: 2025,
    medium: 'Ink and gouache on paper',
    dimensions: { w: 1.2, h: 1.6 },
    price: 12200,
    status: 'available',
    tags: ['linework', 'light', 'memory'],
    description:
      'Her first grid to admit colour: a pale blue that thins toward the top of the sheet the way January light does.',
    image: './artworks/oslo-january-grid.svg',
  },
  {
    id: 'w-halvorsen-5',
    slug: 'the-hour-it-took',
    title: 'The Hour It Took',
    artistId: 'halvorsen',
    year: 2021,
    medium: 'Ink on paper',
    dimensions: { w: 0.65, h: 0.65 },
    price: 3900,
    status: 'sold',
    tags: ['linework', 'monochrome'],
    description: 'A small square drawn in exactly one hour, as an experiment in stopping.',
    image: './artworks/the-hour-it-took.svg',
  },

  // ── Aurelio Banks ───────────────────────────────────────────────────────────
  {
    id: 'w-banks-1',
    slug: 'light-remembered-no-4',
    title: 'Light Remembered No. 4',
    artistId: 'banks',
    year: 2025,
    medium: 'Pigment wash on unprimed linen',
    dimensions: { w: 1.7, h: 1.25 },
    price: 16400,
    status: 'available',
    tags: ['wash', 'light', 'memory'],
    description:
      'Nine pours, each left to dry for a full day. The horizon that appears two thirds of the way up was not planned and was not corrected.',
    image: './artworks/light-remembered-no-4.svg',
  },
  {
    id: 'w-banks-2',
    slug: 'gulf-weather',
    title: 'Gulf Weather',
    artistId: 'banks',
    year: 2024,
    medium: 'Pigment and ash on linen',
    dimensions: { w: 1.15, h: 1.55 },
    price: 13100,
    status: 'available',
    tags: ['wash', 'texture', 'landscape'],
    description:
      'Made during a week of storms, with ground pigment worked into the wet surface so the grain reads as rain from a distance.',
    image: './artworks/gulf-weather.svg',
  },
  {
    id: 'w-banks-3',
    slug: 'evening-arrives-early',
    title: 'Evening Arrives Early',
    artistId: 'banks',
    year: 2023,
    medium: 'Pigment wash on linen',
    dimensions: { w: 0.95, h: 1.35 },
    price: 9200,
    status: 'sold',
    tags: ['wash', 'light'],
    description: 'A vertical work that darkens from the bottom upward, against expectation.',
    image: './artworks/evening-arrives-early.svg',
  },
  {
    id: 'w-banks-4',
    slug: 'unprimed-no-9',
    title: 'Unprimed No. 9',
    artistId: 'banks',
    year: 2022,
    medium: 'Pigment wash on unprimed linen',
    dimensions: { w: 1.35, h: 0.9 },
    price: 8700,
    status: 'available',
    tags: ['wash', 'texture', 'monochrome'],
    description: 'The linen is left bare across the lower third, carrying only what the wash reached.',
    image: './artworks/unprimed-no-9.svg',
  },
  {
    id: 'w-banks-5',
    slug: 'ash-and-morning',
    title: 'Ash and Morning',
    artistId: 'banks',
    year: 2025,
    medium: 'Pigment and ash on linen',
    dimensions: { w: 1.9, h: 1.4 },
    price: 18500,
    status: 'available',
    tags: ['wash', 'light', 'landscape'],
    description:
      'The largest work Banks has completed, and the only one he has allowed to be photographed unfinished.',
    image: './artworks/ash-and-morning.svg',
  },
];

/** @type {Record<string, typeof works[number]>} */
export const worksById = Object.fromEntries(works.map((w) => [w.id, w]));
export const worksBySlug = Object.fromEntries(works.map((w) => [w.slug, w]));

export function getWork(id) {
  return worksById[id] ?? null;
}

export function getWorkBySlug(slug) {
  return worksBySlug[slug] ?? null;
}

export function worksByArtist(artistId) {
  return works.filter((w) => w.artistId === artistId);
}

/**
 * Works by *other* artists that share the most tags with the given work.
 * Ties break by year, newest first, so the list is stable.
 */
export function similarWorks(work, limit = 4) {
  const tags = new Set(work.tags);
  return works
    .filter((w) => w.id !== work.id && w.artistId !== work.artistId)
    .map((w) => ({ work: w, score: w.tags.filter((t) => tags.has(t)).length }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.work.year - a.work.year)
    .slice(0, limit)
    .map((entry) => entry.work);
}

export function formatPrice(work) {
  if (work.status === 'sold') return 'Sold';
  const amount = work.price.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
  return work.status === 'reserved' ? `${amount} · reserved` : amount;
}

/** Dimensions rendered for humans: metres, then centimetres. */
export function formatDimensions(work) {
  const cm = (m) => Math.round(m * 100);
  return `${cm(work.dimensions.h)} × ${cm(work.dimensions.w)} cm`;
}
