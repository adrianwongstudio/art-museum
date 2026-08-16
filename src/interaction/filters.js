/**
 * Narrowing the catalogue down: the logic behind the artwork page's filter rail
 * and sort control.
 *
 * Pure — it takes a list of works and some criteria and gives back a list. The
 * page around it is in ui/pages/artworks.js.
 */

export const DEFAULT_CRITERIA = {
  artists: [],
  mediums: [],
  statuses: [],
  minPrice: null,
  maxPrice: null,
  query: '',
};

export const SORTS = [
  { value: 'recent', label: 'Recently made' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'title', label: 'Title: A–Z' },
];

/**
 * The medium family, taken from the first word of the description. "Acrylic on
 * canvas" and "Acrylic on linen" are one medium to someone browsing; splitting
 * them would give a filter rail full of near-duplicates.
 */
export function mediumOf(work) {
  const first = String(work?.medium ?? '').trim().split(/\s+/)[0];
  return first || 'Other';
}

export function mediums(collection) {
  return [...new Set(collection.map(mediumOf))].sort();
}

export function priceBounds(collection) {
  if (!collection.length) return { min: 0, max: 0 };
  const prices = collection.map((work) => work.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

function matchesQuery(work, query, artistName) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [work.title, work.medium, work.description, artistName ?? work.artistId]
    .join(' ')
    .toLowerCase()
    .includes(needle);
}

/**
 * @param {Array} collection
 * @param {typeof DEFAULT_CRITERIA} criteria
 * @param {{ artistName?: (id: string) => string }} [lookups]
 */
export function filterWorks(collection, criteria, lookups = {}) {
  const { artists, mediums: chosenMediums, statuses, minPrice, maxPrice, query } = {
    ...DEFAULT_CRITERIA,
    ...criteria,
  };

  return collection.filter((work) => {
    if (artists.length && !artists.includes(work.artistId)) return false;
    if (chosenMediums.length && !chosenMediums.includes(mediumOf(work))) return false;
    if (statuses.length && !statuses.includes(work.status)) return false;
    if (minPrice !== null && work.price < minPrice) return false;
    if (maxPrice !== null && work.price > maxPrice) return false;
    return matchesQuery(work, query ?? '', lookups.artistName?.(work.artistId));
  });
}

const COMPARATORS = {
  recent: (a, b) => b.year - a.year || a.title.localeCompare(b.title),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  title: (a, b) => a.title.localeCompare(b.title),
};

export function sortWorks(collection, sort) {
  const comparator = COMPARATORS[sort];
  return comparator ? [...collection].sort(comparator) : [...collection];
}

/** The line above the grid: what is showing, out of what. */
export function summarise(shown, total) {
  if (shown === 0) return 'No works match these filters';
  const noun = shown === 1 ? 'work' : 'works';
  return shown === total ? `${shown} ${noun}` : `${shown} of ${total} works`;
}
