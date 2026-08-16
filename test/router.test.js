import { describe, expect, it } from 'vitest';

import { artistHash, artworkHash, parseHash, roomHash } from '../src/interaction/router.js';

describe('parseHash', () => {
  it('reads an artwork route', () => {
    expect(parseHash('#/artwork/gulf-weather')).toEqual({
      route: 'artwork',
      slug: 'gulf-weather',
    });
  });

  it('reads an artist route', () => {
    expect(parseHash('#/artist/okonkwo')).toEqual({ route: 'artist', id: 'okonkwo' });
  });

  it('treats an empty hash as the room', () => {
    for (const hash of ['', '#', '#/', '#//']) {
      expect(parseHash(hash)).toEqual({ route: 'room' });
    }
  });

  it('tolerates a missing leading hash', () => {
    expect(parseHash('/artwork/gulf-weather')).toEqual({
      route: 'artwork',
      slug: 'gulf-weather',
    });
  });

  it('ignores a trailing slash', () => {
    expect(parseHash('#/artist/banks/')).toEqual({ route: 'artist', id: 'banks' });
  });

  it('decodes percent-encoded segments', () => {
    expect(parseHash('#/artwork/oslo%2Djanuary%2Dgrid')).toEqual({
      route: 'artwork',
      slug: 'oslo-january-grid',
    });
  });

  it('survives a malformed encoding rather than throwing', () => {
    expect(parseHash('#/artwork/%E0%A4%A')).toEqual({ route: 'artwork', slug: '%E0%A4%A' });
  });

  it('falls back to the room for anything it does not recognise', () => {
    expect(parseHash('#/nonsense/here')).toEqual({ route: 'room' });
    expect(parseHash('#/artwork')).toEqual({ route: 'room' });
    expect(parseHash('#/artist/')).toEqual({ route: 'room' });
    expect(parseHash(null)).toEqual({ route: 'room' });
    expect(parseHash(undefined)).toEqual({ route: 'room' });
  });
});

describe('formatting', () => {
  it('builds the hashes it can read back', () => {
    expect(artworkHash('gulf-weather')).toBe('#/artwork/gulf-weather');
    expect(artistHash('okonkwo')).toBe('#/artist/okonkwo');
    expect(roomHash()).toBe('#/');
  });

  it('round-trips', () => {
    expect(parseHash(artworkHash('seed-that-refused'))).toEqual({
      route: 'artwork',
      slug: 'seed-that-refused',
    });
    expect(parseHash(artistHash('halvorsen'))).toEqual({ route: 'artist', id: 'halvorsen' });
    expect(parseHash(roomHash())).toEqual({ route: 'room' });
  });

  it('encodes anything that would break a URL', () => {
    expect(artworkHash('a b/c')).toBe('#/artwork/a%20b%2Fc');
  });
});
