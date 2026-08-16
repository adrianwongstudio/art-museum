import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CRITERIA,
  SORTS,
  filterWorks,
  mediumOf,
  mediums,
  priceBounds,
  sortWorks,
  summarise,
} from '../src/interaction/filters.js';
import { works } from '../src/data/works.js';

const noFilters = () => ({ ...DEFAULT_CRITERIA });

describe('filterWorks', () => {
  it('returns everything when nothing is chosen', () => {
    expect(filterWorks(works, noFilters())).toHaveLength(works.length);
  });

  it('filters by artist', () => {
    const result = filterWorks(works, { ...noFilters(), artists: ['banks'] });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((w) => w.artistId === 'banks')).toBe(true);
  });

  it('treats several artists as "any of"', () => {
    const result = filterWorks(works, { ...noFilters(), artists: ['banks', 'okonkwo'] });
    expect(result.every((w) => ['banks', 'okonkwo'].includes(w.artistId))).toBe(true);
    expect(result.length).toBeGreaterThan(filterWorks(works, { ...noFilters(), artists: ['banks'] }).length);
  });

  it('filters by availability', () => {
    const result = filterWorks(works, { ...noFilters(), statuses: ['available'] });
    expect(result.every((w) => w.status === 'available')).toBe(true);
    expect(result.some((w) => w.status === 'sold')).toBe(false);
  });

  it('filters by medium family rather than by exact wording', () => {
    // "Acrylic on canvas" and "Acrylic on linen" are one medium to a buyer.
    const result = filterWorks(works, { ...noFilters(), mediums: ['Acrylic'] });
    expect(result.length).toBeGreaterThan(1);
    expect(result.every((w) => w.medium.startsWith('Acrylic'))).toBe(true);
  });

  it('filters by price range, inclusive at both ends', () => {
    const result = filterWorks(works, { ...noFilters(), minPrice: 9000, maxPrice: 11000 });
    expect(result.every((w) => w.price >= 9000 && w.price <= 11000)).toBe(true);

    const exact = works[0];
    const pinned = filterWorks([exact], {
      ...noFilters(),
      minPrice: exact.price,
      maxPrice: exact.price,
    });
    expect(pinned).toHaveLength(1);
  });

  it('searches title, artist name and medium', () => {
    expect(filterWorks(works, { ...noFilters(), query: 'gulf' })[0].slug).toBe('gulf-weather');
    expect(filterWorks(works, { ...noFilters(), query: 'halvorsen' }).length).toBeGreaterThan(0);
    expect(filterWorks(works, { ...noFilters(), query: 'ink' }).length).toBeGreaterThan(0);
  });

  it('ignores case and stray spaces in the search', () => {
    expect(filterWorks(works, { ...noFilters(), query: '  GULF  ' })[0].slug).toBe('gulf-weather');
  });

  it('combines every criterion', () => {
    const result = filterWorks(works, {
      ...noFilters(),
      artists: ['banks'],
      statuses: ['available'],
      maxPrice: 14000,
    });
    expect(result.every((w) => w.artistId === 'banks' && w.status === 'available' && w.price <= 14000)).toBe(true);
  });

  it('can come back empty without complaining', () => {
    expect(filterWorks(works, { ...noFilters(), query: 'zzzznothing' })).toEqual([]);
  });

  it('does not mutate the collection it is given', () => {
    const before = works.map((w) => w.id);
    filterWorks(works, { ...noFilters(), artists: ['banks'] });
    expect(works.map((w) => w.id)).toEqual(before);
  });
});

describe('sortWorks', () => {
  it('sorts by price, low to high and back', () => {
    const up = sortWorks(works, 'price-asc').map((w) => w.price);
    expect(up).toEqual([...up].sort((a, b) => a - b));

    const down = sortWorks(works, 'price-desc').map((w) => w.price);
    expect(down).toEqual([...down].sort((a, b) => b - a));
  });

  it('sorts by year, newest first', () => {
    const years = sortWorks(works, 'recent').map((w) => w.year);
    expect(years).toEqual([...years].sort((a, b) => b - a));
  });

  it('sorts by title', () => {
    const titles = sortWorks(works, 'title').map((w) => w.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });

  it('leaves the order alone for an unknown sort', () => {
    expect(sortWorks(works, 'nonsense').map((w) => w.id)).toEqual(works.map((w) => w.id));
  });

  it('returns a new array rather than sorting in place', () => {
    const before = works.map((w) => w.id);
    sortWorks(works, 'price-desc');
    expect(works.map((w) => w.id)).toEqual(before);
  });

  it('offers every sort it claims to', () => {
    for (const { value } of SORTS) {
      expect(() => sortWorks(works, value)).not.toThrow();
    }
  });
});

describe('facets', () => {
  it('lists medium families, deduplicated and sorted', () => {
    const list = mediums(works);
    expect(new Set(list).size).toBe(list.length);
    expect(list).toEqual([...list].sort());
    expect(list).toContain('Acrylic');
    expect(list).toContain('Ink');
  });

  it('reads the medium family off the front of the description', () => {
    expect(mediumOf({ medium: 'Pigment and ash on linen' })).toBe('Pigment');
    expect(mediumOf({ medium: 'Acrylic on canvas' })).toBe('Acrylic');
    expect(mediumOf({ medium: '' })).toBe('Other');
    expect(mediumOf({})).toBe('Other');
  });

  it('reports the price range of the collection', () => {
    const { min, max } = priceBounds(works);
    expect(min).toBeLessThanOrEqual(max);
    expect(min).toBe(Math.min(...works.map((w) => w.price)));
    expect(max).toBe(Math.max(...works.map((w) => w.price)));
  });

  it('copes with an empty collection', () => {
    expect(priceBounds([])).toEqual({ min: 0, max: 0 });
    expect(mediums([])).toEqual([]);
  });
});

describe('summarise', () => {
  it('counts what is showing', () => {
    expect(summarise(21, 21)).toBe('21 works');
    expect(summarise(4, 21)).toBe('4 of 21 works');
  });

  it('speaks in the singular where it should', () => {
    expect(summarise(1, 1)).toBe('1 work');
    expect(summarise(1, 21)).toBe('1 of 21 works');
  });

  it('says so when nothing matches', () => {
    expect(summarise(0, 21)).toBe('No works match these filters');
  });
});
