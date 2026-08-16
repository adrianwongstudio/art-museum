/**
 * The one line of instruction the gallery needs, and a way to get it back.
 */

const DESKTOP = 'Click a painting to walk up to it · drag to look around · WASD to wander';
const TOUCH = 'Tap a painting to walk up to it · drag to look around';

export function createHints({ root, toggle }) {
  const text = root.querySelector('.hint__text');
  const close = root.querySelector('.hint__close');
  const touch = window.matchMedia('(pointer: coarse)').matches;
  let dismissed = false;

  text.textContent = touch ? TOUCH : DESKTOP;

  function hide() {
    dismissed = true;
    root.classList.remove('is-open');
    setTimeout(() => {
      root.hidden = true;
    }, 300);
    toggle.hidden = false;
  }

  function show() {
    root.hidden = false;
    requestAnimationFrame(() => root.classList.add('is-open'));
    toggle.hidden = true;
  }

  close.addEventListener('click', hide);
  toggle.addEventListener('click', () => {
    dismissed = false;
    show();
  });

  return {
    show,
    hide,
    /** Called once the visitor has clearly worked it out for themselves. */
    retire() {
      if (!dismissed) hide();
    },
  };
}
