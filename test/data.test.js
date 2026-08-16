import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { artists, artistsById } from '../src/data/artists.js';
import { hangings, placements, room, sculpture, walls } from '../src/data/gallery.js';
import { formatDimensions, formatPrice, similarWorks, works, worksByArtist } from '../src/data/works.js';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

describe('catalogue', () => {
  it('has unique ids and slugs', () => {
    expect(new Set(works.map((w) => w.id)).size).toBe(works.length);
    expect(new Set(works.map((w) => w.slug)).size).toBe(works.length);
    expect(new Set(artists.map((a) => a.id)).size).toBe(artists.length);
  });

  it('attributes every work to an artist who exists', () => {
    for (const work of works) {
      expect(artistsById[work.artistId], `${work.slug} has no artist`).toBeTruthy();
    }
  });

  it('gives every artist at least one work', () => {
    for (const artist of artists) {
      expect(worksByArtist(artist.id).length).toBeGreaterThan(0);
    }
  });

  it('describes every work well enough to sell it', () => {
    for (const work of works) {
      expect(work.title.length, work.slug).toBeGreaterThan(0);
      expect(work.description.length, work.slug).toBeGreaterThan(30);
      expect(work.medium.length, work.slug).toBeGreaterThan(0);
      expect(work.year).toBeGreaterThan(1900);
      expect(work.price).toBeGreaterThan(0);
      expect(['available', 'reserved', 'sold']).toContain(work.status);
    }
  });

  it('gives every work honest, hangable dimensions', () => {
    for (const work of works) {
      expect(work.dimensions.w, work.slug).toBeGreaterThan(0.2);
      expect(work.dimensions.h, work.slug).toBeGreaterThan(0.2);
      // Nothing may be taller than the space between the floor and the ceiling.
      expect(work.dimensions.h).toBeLessThan(room.height - room.hangCenterY);
      expect(work.dimensions.w).toBeLessThan(4);
    }
  });

  it('points every work at an image that exists on disk', () => {
    for (const work of works) {
      const file = join(PUBLIC_DIR, work.image.replace(/^\.\//, ''));
      expect(existsSync(file), `${work.slug}: missing ${work.image}`).toBe(true);
    }
  });

  it('tags every work so similar works can be found', () => {
    for (const work of works) {
      expect(work.tags.length, work.slug).toBeGreaterThan(0);
    }
  });
});

describe('similarWorks', () => {
  it('never returns the work itself or its own artist', () => {
    for (const work of works) {
      for (const other of similarWorks(work)) {
        expect(other.id).not.toBe(work.id);
        expect(other.artistId).not.toBe(work.artistId);
      }
    }
  });

  it('finds something for every hung work', () => {
    for (const hanging of hangings) {
      expect(similarWorks(hanging.work).length, hanging.work.slug).toBeGreaterThan(0);
    }
  });

  it('respects the limit', () => {
    expect(similarWorks(works[0], 2).length).toBeLessThanOrEqual(2);
  });
});

describe('the hang', () => {
  it('hangs exactly eight works', () => {
    expect(hangings).toHaveLength(8);
  });

  it('references works that exist, with no duplicates', () => {
    const ids = placements.map((p) => p.workId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(sculpture.workId);
  });

  it('never hangs two works in the same spot', () => {
    const spots = placements.map((p) => `${p.wall}@${p.offset}`);
    expect(new Set(spots).size).toBe(spots.length);
  });

  it('leaves the entrance wall clear', () => {
    expect(placements.some((p) => p.wall === room.doorway.wall)).toBe(false);
  });

  it('keeps every work on its wall, clear of the corners', () => {
    for (const hanging of hangings) {
      const wall = walls[hanging.wall];
      const halfSpan = (wall.axis === 'x' ? room.width : room.depth) / 2;
      const halfWork = hanging.work.dimensions.w / 2;
      expect(Math.abs(hanging.offset) + halfWork, hanging.work.slug).toBeLessThan(halfSpan - 0.3);
    }
  });

  it('keeps neighbouring works from touching', () => {
    for (const wall of ['north', 'south', 'east']) {
      const onWall = hangings
        .filter((h) => h.wall === wall)
        .sort((a, b) => a.offset - b.offset);
      for (let i = 1; i < onWall.length; i += 1) {
        const gap =
          onWall[i].offset -
          onWall[i - 1].offset -
          onWall[i].work.dimensions.w / 2 -
          onWall[i - 1].work.dimensions.w / 2;
        expect(gap, `${wall}: ${onWall[i - 1].work.slug} → ${onWall[i].work.slug}`).toBeGreaterThan(0.8);
      }
    }
  });

  it('places the work on the wall plane, at the hanging height', () => {
    for (const hanging of hangings) {
      const wall = walls[hanging.wall];
      expect(hanging.position.y).toBe(room.hangCenterY);
      if (wall.axis === 'x') expect(hanging.position.z).toBe(wall.fixed);
      else expect(hanging.position.x).toBe(wall.fixed);
    }
  });

  it('hangs the whole exhibition so it clears the floor', () => {
    for (const hanging of hangings) {
      expect(room.hangCenterY - hanging.work.dimensions.h / 2).toBeGreaterThan(0.3);
    }
  });

  it('has a sculpture in the middle that is not one of the eight', () => {
    expect(sculpture.position).toEqual({ x: 0, y: 0, z: 0 });
    expect(hangings.some((h) => h.work.id === sculpture.workId)).toBe(false);
  });
});

describe('display helpers', () => {
  it('prices available work in dollars', () => {
    expect(formatPrice({ price: 14500, status: 'available' })).toBe('$14,500');
  });

  it('says sold instead of a price', () => {
    expect(formatPrice({ price: 8200, status: 'sold' })).toBe('Sold');
  });

  it('marks reserved work', () => {
    expect(formatPrice({ price: 12800, status: 'reserved' })).toBe('$12,800 · reserved');
  });

  it('renders dimensions height first, in centimetres', () => {
    expect(formatDimensions({ dimensions: { w: 1.3, h: 1.8 } })).toBe('180 × 130 cm');
  });
});
