/**
 * The top bar: Exhibition, Artists, Artwork, Contact, and then the theme toggle.
 *
 * Real links with real hrefs, so they can be opened in a new tab, copied, and
 * read by a crawler. Clicks are intercepted only to avoid a needless reload.
 *
 * On a narrow screen the four collapse behind a menu button, because four links
 * and a toggle do not fit across a phone without becoming unreadable.
 */

import { pageHash, roomHash } from '../interaction/router.js';
import { el } from './dom.js';

const ITEMS = [
  { route: 'room', label: 'Exhibition', href: roomHash() },
  { route: 'artists', label: 'Artists', href: pageHash('artists') },
  { route: 'artworks', label: 'Artwork', href: pageHash('artworks') },
  { route: 'contact', label: 'Contact', href: pageHash('contact') },
];

export function createNav({ root, toggle, onNavigate }) {
  const links = new Map();
  let open = false;

  const list = el(
    'ul',
    { class: 'nav__list' },
    ITEMS.map((item) => {
      const link = el('a', {
        class: 'nav__link',
        href: item.href,
        text: item.label,
        onclick: (event) => {
          // Let modified clicks do what the visitor expects — new tab, new window.
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          close();
          onNavigate(item.route);
        },
      });
      links.set(item.route, link);
      return el('li', {}, [link]);
    }),
  );

  const menuButton = el('button', {
    class: 'nav__menu',
    type: 'button',
    'aria-label': 'Menu',
    'aria-expanded': 'false',
    'aria-controls': 'nav-list',
    html: '<span></span><span></span>',
    onclick: () => (open ? close() : openMenu()),
  });

  list.id = 'nav-list';

  function openMenu() {
    open = true;
    root.classList.add('is-open');
    menuButton.setAttribute('aria-expanded', 'true');
  }

  function close() {
    open = false;
    root.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
  }

  // A tap anywhere else puts the menu away.
  document.addEventListener('click', (event) => {
    if (open && !root.contains(event.target)) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) {
      close();
      menuButton.focus();
    }
  });

  root.append(menuButton, list);
  // The toggle belongs to the bar but is built in index.html, so it keeps
  // working before any of this runs.
  root.append(toggle);

  return {
    /** Mark where the visitor is. `room` covers every route inside the gallery. */
    setCurrent(route) {
      const active = ['artists', 'artworks', 'contact'].includes(route) ? route : 'room';
      for (const [name, link] of links) {
        link.classList.toggle('is-current', name === active);
        if (name === active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
    },

    close,
  };
}
