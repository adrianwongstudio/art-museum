/**
 * Generates the placeholder artwork for the gallery.
 *
 *   npm run art
 *
 * Every work in src/data/works.js gets a deterministic SVG in public/artworks/,
 * sized to its real aspect ratio and drawn in the visual language of its artist,
 * so the room reads as four different hands rather than one texture repeated.
 *
 * Output is seeded from the work's slug: the same catalogue always produces the
 * same pictures. Delete a file and re-run to get it back unchanged.
 *
 * These are placeholders. When real photographs arrive, drop them in
 * public/artworks/ and point the work's `image` field at them.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { works } from '../src/data/works.js';
import { artistsById } from '../src/data/artists.js';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'artworks');
const LONG_EDGE = 1200;

// ── deterministic randomness ──────────────────────────────────────────────────

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = (rng, min, max) => min + rng() * (max - min);
const randInt = (rng, min, max) => Math.floor(rand(rng, min, max + 1));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const round = (n) => Math.round(n * 100) / 100;

// ── palettes ──────────────────────────────────────────────────────────────────

const PALETTES = {
  fields: {
    ground: '#f3ead3',
    colours: ['#c8553d', '#f0a202', '#1f6f78', '#6a3b5e', '#2b2b2b', '#dfd3b3', '#a8471f'],
  },
  organic: {
    ground: '#e6ded2',
    colours: ['#b25c3f', '#8a6f57', '#5f4b3a', '#d8c3a5', '#2f2a24', '#9c6b4f'],
  },
  linework: {
    ground: '#f4f1e8',
    colours: ['#1c1c1a', '#2a3b56', '#7d3a2e', '#9fb6cd'],
  },
  wash: {
    ground: '#f1ece2',
    colours: ['#b9c6c8', '#6f7f86', '#cf9a72', '#3f4b52', '#e7d9c4', '#8d6f63'],
  },
};

// ── styles ────────────────────────────────────────────────────────────────────

/** Hard-edge colour fields: flat bands meeting at unmodulated edges. */
function drawFields(rng, w, h, palette) {
  const vertical = w >= h ? rng() < 0.35 : rng() < 0.75;
  const count = randInt(rng, 3, 5);
  const total = vertical ? h : w;

  // Uneven band sizes that still add up to the full edge.
  const weights = Array.from({ length: count }, () => rand(rng, 0.6, 1.8));
  const sum = weights.reduce((a, b) => a + b, 0);

  const chosen = [];
  const pool = [...palette.colours];
  for (let i = 0; i < count; i += 1) {
    const idx = Math.floor(rng() * pool.length);
    chosen.push(pool.splice(idx, 1)[0] ?? pick(rng, palette.colours));
  }

  let cursor = 0;
  const parts = [];
  weights.forEach((weight, i) => {
    const size = (weight / sum) * total;
    parts.push(
      vertical
        ? `<rect x="0" y="${round(cursor)}" width="${w}" height="${round(size + 0.5)}" fill="${chosen[i]}"/>`
        : `<rect x="${round(cursor)}" y="0" width="${round(size + 0.5)}" height="${h}" fill="${chosen[i]}"/>`,
    );
    cursor += size;
  });

  // An inset rectangle interrupting the bands, in roughly a third of the works.
  if (rng() < 0.45) {
    const rw = rand(rng, w * 0.18, w * 0.4);
    const rh = rand(rng, h * 0.18, h * 0.4);
    parts.push(
      `<rect x="${round(rand(rng, w * 0.1, w * 0.9 - rw))}" y="${round(rand(rng, h * 0.1, h * 0.9 - rh))}" width="${round(rw)}" height="${round(rh)}" fill="${pick(rng, palette.colours)}"/>`,
    );
  }

  // A single seam, repainted many times.
  const seam = rand(rng, total * 0.3, total * 0.7);
  parts.push(
    vertical
      ? `<rect x="0" y="${round(seam)}" width="${w}" height="2" fill="#00000022"/>`
      : `<rect x="${round(seam)}" y="0" width="2" height="${h}" fill="#00000022"/>`,
  );

  return parts.join('');
}

/** A closed bezier loop around a jittered circle — the organic forms. */
function blobPath(rng, cx, cy, radius, wobble) {
  const points = randInt(rng, 7, 10);
  const pts = [];
  for (let i = 0; i < points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius * rand(rng, 1 - wobble, 1 + wobble);
    pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * rand(rng, 0.85, 1.15)]);
  }

  let d = `M ${round(pts[0][0])} ${round(pts[0][1])}`;
  for (let i = 0; i < pts.length; i += 1) {
    const cur = pts[i];
    const next = pts[(i + 1) % pts.length];
    const mid = [(cur[0] + next[0]) / 2, (cur[1] + next[1]) / 2];
    d += ` Q ${round(cur[0])} ${round(cur[1])} ${round(mid[0])} ${round(mid[1])}`;
  }
  return `${d} Z`;
}

/** Pressed pulp: soft masses, warm cores, speckled surface. */
function drawOrganic(rng, w, h, palette) {
  const parts = [`<rect width="${w}" height="${h}" fill="${palette.ground}"/>`];
  const forms = randInt(rng, 1, 3);
  const short = Math.min(w, h);

  for (let i = 0; i < forms; i += 1) {
    const cx = forms === 1 ? w * rand(rng, 0.42, 0.58) : w * ((i + 0.5) / forms) * rand(rng, 0.85, 1.15);
    const cy = h * rand(rng, 0.35, 0.62);
    const radius = (short / (forms + 0.6)) * rand(rng, 0.5, 0.78);
    const outer = pick(rng, palette.colours);
    const inner = pick(rng, palette.colours);

    parts.push(`<path d="${blobPath(rng, cx, cy, radius * 1.06, 0.1)}" fill="#00000014"/>`);
    parts.push(`<path d="${blobPath(rng, cx, cy, radius, 0.12)}" fill="${outer}"/>`);
    parts.push(
      `<path d="${blobPath(rng, cx + rand(rng, -radius * 0.15, radius * 0.15), cy + rand(rng, -radius * 0.15, radius * 0.15), radius * rand(rng, 0.35, 0.6), 0.18)}" fill="${inner}" opacity="0.85"/>`,
    );
  }

  // Speckle from the cloth the pulp was pressed against.
  for (let i = 0; i < 220; i += 1) {
    parts.push(
      `<circle cx="${round(rand(rng, 0, w))}" cy="${round(rand(rng, 0, h))}" r="${round(rand(rng, 0.6, 2.4))}" fill="#3a2f26" opacity="${round(rand(rng, 0.03, 0.14))}"/>`,
    );
  }

  return parts.join('');
}

/** Hand-ruled grids that accumulate a drift as the hours pass. */
function drawLinework(rng, w, h, palette) {
  const parts = [`<rect width="${w}" height="${h}" fill="${palette.ground}"/>`];
  const ink = palette.colours[0];
  const accent = pick(rng, palette.colours.slice(1));

  const margin = Math.min(w, h) * rand(rng, 0.06, 0.12);
  const innerW = w - margin * 2;
  const innerH = h - margin * 2;

  const lines = randInt(rng, 55, 120);
  const gap = innerW / lines;
  let drift = 0;
  const faultAt = rng() < 0.5 ? randInt(rng, Math.floor(lines * 0.3), Math.floor(lines * 0.7)) : -1;

  for (let i = 0; i <= lines; i += 1) {
    drift += rand(rng, -0.12, 0.34); // the hand tiring, always to the right
    if (i === faultAt) drift += gap * rand(rng, 1.2, 2.2); // the displaced column
    const x = margin + i * gap + drift;
    if (x > w - margin * 0.5) break;
    const colour = i === faultAt ? accent : ink;
    parts.push(
      `<line x1="${round(x)}" y1="${round(margin + rand(rng, -2, 2))}" x2="${round(x + rand(rng, -3, 3))}" y2="${round(h - margin + rand(rng, -2, 2))}" stroke="${colour}" stroke-width="${round(rand(rng, 0.7, 1.6))}" opacity="${round(rand(rng, 0.5, 0.95))}"/>`,
    );
  }

  const rules = randInt(rng, 4, 11);
  for (let i = 1; i < rules; i += 1) {
    const y = margin + (innerH / rules) * i + rand(rng, -3, 3);
    parts.push(
      `<line x1="${round(margin)}" y1="${round(y)}" x2="${round(w - margin)}" y2="${round(y + rand(rng, -2.5, 2.5))}" stroke="${accent}" stroke-width="${round(rand(rng, 0.6, 1.3))}" opacity="${round(rand(rng, 0.25, 0.6))}"/>`,
    );
  }

  return parts.join('');
}

/** Layered pours on unprimed linen, with grain. */
function drawWash(rng, w, h, palette, id) {
  const layers = randInt(rng, 4, 7);
  const defs = [];
  const parts = [`<rect width="${w}" height="${h}" fill="${palette.ground}"/>`];

  for (let i = 0; i < layers; i += 1) {
    const gid = `g-${id}-${i}`;
    const colour = pick(rng, palette.colours);
    const angle = rand(rng, 0, 360);
    const rad = (angle * Math.PI) / 180;
    defs.push(
      `<linearGradient id="${gid}" x1="${round(50 - Math.cos(rad) * 50)}%" y1="${round(50 - Math.sin(rad) * 50)}%" x2="${round(50 + Math.cos(rad) * 50)}%" y2="${round(50 + Math.sin(rad) * 50)}%">` +
        `<stop offset="0%" stop-color="${colour}" stop-opacity="${round(rand(rng, 0.35, 0.8))}"/>` +
        `<stop offset="${round(rand(rng, 40, 75))}%" stop-color="${colour}" stop-opacity="${round(rand(rng, 0.08, 0.3))}"/>` +
        `<stop offset="100%" stop-color="${colour}" stop-opacity="0"/>` +
        `</linearGradient>`,
    );
    const pad = rand(rng, -0.15, 0.1);
    parts.push(
      `<rect x="${round(w * pad)}" y="${round(h * rand(rng, -0.1, 0.35))}" width="${round(w * rand(rng, 0.7, 1.3))}" height="${round(h * rand(rng, 0.35, 0.9))}" fill="url(#${gid})"/>`,
    );
  }

  // The horizon that was not planned and was not corrected.
  if (rng() < 0.7) {
    const y = h * rand(rng, 0.55, 0.72);
    parts.push(
      `<rect x="0" y="${round(y)}" width="${w}" height="${round(rand(rng, 1.5, 4))}" fill="${pick(rng, palette.colours)}" opacity="0.28"/>`,
    );
  }

  const grainId = `grain-${id}`;
  defs.push(
    `<filter id="${grainId}" x="0" y="0" width="100%" height="100%">` +
      `<feTurbulence type="fractalNoise" baseFrequency="${round(rand(rng, 0.6, 0.95))}" numOctaves="3" stitchTiles="stitch"/>` +
      `<feColorMatrix type="saturate" values="0"/>` +
      `</filter>`,
  );
  parts.push(
    `<rect width="${w}" height="${h}" filter="url(#${grainId})" opacity="${round(rand(rng, 0.1, 0.2))}" style="mix-blend-mode:multiply"/>`,
  );

  return `<defs>${defs.join('')}</defs>${parts.join('')}`;
}

const STYLES = {
  fields: drawFields,
  organic: drawOrganic,
  linework: drawLinework,
  wash: drawWash,
};

// ── assembly ──────────────────────────────────────────────────────────────────

function svgFor(work) {
  const artist = artistsById[work.artistId];
  if (!artist) throw new Error(`${work.slug}: unknown artist ${work.artistId}`);
  const style = STYLES[artist.style] ?? drawFields;
  const palette = PALETTES[artist.style] ?? PALETTES.fields;

  const ratio = work.dimensions.w / work.dimensions.h;
  const width = Math.round(ratio >= 1 ? LONG_EDGE : LONG_EDGE * ratio);
  const height = Math.round(ratio >= 1 ? LONG_EDGE / ratio : LONG_EDGE);

  const rng = mulberry32(hashSeed(work.slug));
  const body = style(rng, width, height, palette, hashSeed(work.slug).toString(36));

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}" role="img" aria-label="${work.title}">` +
    `<title>${work.title}</title>${body}</svg>\n`
  );
}

mkdirSync(OUT_DIR, { recursive: true });

let written = 0;
for (const work of works) {
  const file = join(OUT_DIR, `${work.slug}.svg`);
  writeFileSync(file, svgFor(work), 'utf8');
  written += 1;
}

console.log(`Generated ${written} placeholder artworks in public/artworks/`);
