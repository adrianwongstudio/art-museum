/**
 * Textures drawn at runtime on a 2D canvas — the floor's boards, the papier-mâché
 * surface, and the printed placard beside each work.
 *
 * Drawing these rather than shipping images keeps the gallery to one network
 * request per artwork and lets the placards read straight from the catalogue.
 */

import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

import { formatDimensions, formatPrice } from '../data/works.js';
import { artistsById } from '../data/artists.js';

function canvasOf(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d') };
}

/** Pale oak boards, laid along x. */
export function createFloorTexture() {
  const { canvas, ctx } = canvasOf(1024, 1024);
  const boards = 8;
  const boardHeight = canvas.height / boards;

  ctx.fillStyle = '#d9c9ae';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let b = 0; b < boards; b += 1) {
    const y = b * boardHeight;
    const tone = 208 + Math.round(Math.sin(b * 12.9898) * 14);
    ctx.fillStyle = `rgb(${tone}, ${tone - 22}, ${tone - 56})`;
    ctx.fillRect(0, y, canvas.width, boardHeight - 1);

    // Grain
    ctx.strokeStyle = 'rgba(120, 92, 58, 0.16)';
    for (let g = 0; g < 26; g += 1) {
      const gy = y + ((g * 37) % boardHeight);
      ctx.beginPath();
      ctx.moveTo(0, gy);
      for (let x = 0; x <= canvas.width; x += 32) {
        ctx.lineTo(x, gy + Math.sin((x + b * 90 + g * 15) * 0.01) * 2.2);
      }
      ctx.lineWidth = 0.6 + (g % 3) * 0.35;
      ctx.stroke();
    }

    // Board seam
    ctx.fillStyle = 'rgba(88, 66, 40, 0.35)';
    ctx.fillRect(0, y + boardHeight - 1.5, canvas.width, 1.5);

    // Staggered end joints
    const joint = ((b * 317) % canvas.width) | 0;
    ctx.fillRect(joint, y, 1.5, boardHeight);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(5, 3);
  texture.anisotropy = 4;
  return texture;
}

/** A soft round contact shadow, for sitting objects on the floor without a shadow map. */
export function createContactShadowTexture() {
  const { canvas, ctx } = canvasOf(256, 256);
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  gradient.addColorStop(0.45, 'rgba(0, 0, 0, 0.28)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return new CanvasTexture(canvas);
}

/** Torn, layered paper — used on the centre sculpture. */
export function createPaperTexture() {
  const { canvas, ctx } = canvasOf(512, 512);

  ctx.fillStyle = '#e9dfd0';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Overlapping torn patches, sanded back so earlier layers show through.
  for (let i = 0; i < 70; i += 1) {
    const cx = Math.random() * canvas.width;
    const cy = Math.random() * canvas.height;
    const r = 24 + Math.random() * 70;
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 8) {
      const rr = r * (0.75 + Math.random() * 0.45);
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const shade = 214 + Math.round(Math.random() * 30) - 15;
    ctx.fillStyle = `rgba(${shade}, ${shade - 12}, ${shade - 32}, ${0.16 + Math.random() * 0.2})`;
    ctx.fill();
    ctx.strokeStyle = 'rgba(150, 128, 104, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Fibre
  for (let i = 0; i < 5000; i += 1) {
    ctx.fillStyle = `rgba(120, 100, 78, ${Math.random() * 0.12})`;
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1.4, 1.4);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(3, 3);
  return texture;
}

/**
 * The printed card beside a work. Rendered at print-like proportions so it is
 * legible from the viewing position without being legible from across the room.
 */
export function createPlacardTexture(work) {
  const { canvas, ctx } = canvasOf(700, 440);
  const artist = artistsById[work.artistId];

  ctx.fillStyle = '#fbfaf7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#1d1b18';
  ctx.fillRect(56, 56, 92, 3);

  const line = (text, { y, size, weight = '400', style = 'normal', colour = '#1d1b18' }) => {
    ctx.fillStyle = colour;
    ctx.font = `${style} ${weight} ${size}px Georgia, 'Times New Roman', serif`;
    ctx.fillText(text, 56, y);
  };

  // Title wraps to two lines if it must.
  ctx.font = 'italic 400 46px Georgia, serif';
  const words = work.title.split(' ');
  const lines = [''];
  for (const word of words) {
    const candidate = lines.at(-1) ? `${lines.at(-1)} ${word}` : word;
    if (ctx.measureText(candidate).width > canvas.width - 112 && lines.at(-1)) lines.push(word);
    else lines[lines.length - 1] = candidate;
  }

  let y = 128;
  for (const text of lines.slice(0, 2)) {
    line(text, { y, size: 46, style: 'italic' });
    y += 54;
  }

  y += 12;
  line(`${artist?.name ?? ''}, ${work.year}`, { y, size: 32 });
  y += 46;
  line(work.medium, { y, size: 27, colour: '#5c5750' });
  y += 40;
  line(formatDimensions(work), { y, size: 27, colour: '#5c5750' });
  y += 46;
  line(formatPrice(work), {
    y,
    size: 30,
    weight: '700',
    colour: work.status === 'sold' ? '#8a2f22' : '#1d1b18',
  });

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
