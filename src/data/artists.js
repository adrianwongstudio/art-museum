/**
 * Artists exhibiting in The Long Room.
 *
 * PLACEHOLDER CONTENT. These four artists are invented so the gallery has something
 * coherent to show. Replace the names, biographies and statements with the real
 * roster; nothing else in the codebase needs to change.
 *
 * `style` selects the visual language used by scripts/generate-placeholder-art.mjs
 * and is only meaningful while placeholder imagery is in use.
 */

export const artists = [
  {
    id: 'okonkwo',
    name: 'Mireille Okonkwo',
    born: 1978,
    location: 'Lisbon',
    style: 'fields',
    bio: 'Okonkwo builds paintings out of flat, unmodulated colour laid edge to edge, working at the scale of a doorway or a window so the eye has to travel across the surface rather than take it in at once.',
    statement: 'I am interested in the moment a colour stops being a colour and becomes a place.',
  },
  {
    id: 'reyes-vidal',
    name: 'Tomás Reyes-Vidal',
    born: 1985,
    location: 'Oaxaca',
    style: 'organic',
    bio: 'Reyes-Vidal paints and sculpts forms that sit somewhere between a seed, an organ and a stone. His work on paper begins as pressed pulp and is finished with pigment while still damp.',
    statement: 'Everything I make is a body that has not decided what kind of body it is yet.',
  },
  {
    id: 'halvorsen',
    name: 'Junko Halvorsen',
    born: 1969,
    location: 'Oslo',
    style: 'linework',
    bio: 'Halvorsen draws grids by hand — thousands of ruled ink lines that accumulate small errors until the structure begins to breathe. She has worked in the same three inks since 1998.',
    statement: 'The ruler gives you the line. The hand gives you the hour it took.',
  },
  {
    id: 'banks',
    name: 'Aurelio Banks',
    born: 1991,
    location: 'New Orleans',
    style: 'wash',
    bio: 'Banks works in layered washes on unprimed linen, letting each pour dry before the next, so the finished surface holds a record of its own weather. Recent works introduce ground pigment and ash.',
    statement: 'I want the painting to look like light remembered rather than light observed.',
  },
];

/** @type {Record<string, typeof artists[number]>} */
export const artistsById = Object.fromEntries(artists.map((a) => [a.id, a]));

export function getArtist(id) {
  return artistsById[id] ?? null;
}
