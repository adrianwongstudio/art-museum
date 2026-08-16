/**
 * Eight dots along the bottom: which works you have seen, and a way to walk to
 * any of them without hunting for it on a wall.
 */

import { hangings } from '../data/gallery.js';
import { clear, el } from './dom.js';

export function createDots({ root, progress, onSelect }) {
  const buttons = new Map();
  let currentSlug = null;

  clear(root);
  for (const hanging of hangings) {
    const button = el('button', {
      class: 'dot',
      type: 'button',
      title: `${hanging.work.title} — ${hanging.wall} wall`,
      'aria-label': `Walk to ${hanging.work.title}`,
      onclick: () => onSelect?.(hanging),
    });
    buttons.set(hanging.work.slug, button);
    root.append(button);
  }

  const counter = el('span', { class: 'dots__count' });
  root.append(counter);

  function refresh(activeSlug = null) {
    for (const [slug, button] of buttons) {
      button.classList.toggle('is-viewed', progress.has(slug));
      button.classList.toggle('is-current', slug === activeSlug);
      button.setAttribute('aria-current', slug === activeSlug ? 'true' : 'false');
    }
    counter.textContent = `${progress.count()} / ${hangings.length}`;
  }

  progress.subscribe(() => refresh(currentSlug));
  refresh();

  return {
    show() {
      root.hidden = false;
    },
    setCurrent(slug) {
      currentSlug = slug;
      refresh(slug);
    },
  };
}
