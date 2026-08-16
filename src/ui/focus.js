/**
 * Keeping the keyboard where it belongs.
 *
 * The artist view and the lightbox are modal: while one is open, Tab must stay
 * inside it, and closing it must hand focus back to whatever opened it. Without
 * this, a keyboard visitor tabs straight out of the dialog into a gallery they
 * cannot see.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function focusableWithin(root) {
  return [...root.querySelectorAll(FOCUSABLE)].filter(
    (node) => node.offsetParent !== null || node === document.activeElement,
  );
}

/**
 * Confine focus to `root` until the returned function is called.
 * @returns {() => void} release, which also restores the previous focus
 */
export function trapFocus(root) {
  const previous = document.activeElement;

  function onKeyDown(event) {
    if (event.key !== 'Tab') return;

    const items = focusableWithin(root);
    if (items.length === 0) {
      event.preventDefault();
      return;
    }

    const first = items[0];
    const last = items.at(-1);
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !root.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !root.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }

  document.addEventListener('keydown', onKeyDown, true);

  return function release() {
    document.removeEventListener('keydown', onKeyDown, true);
    if (previous instanceof HTMLElement && document.contains(previous)) {
      previous.focus({ preventScroll: true });
    }
  };
}

/**
 * True when focus sits inside one of the page's reading surfaces — the panel or
 * an overlay — where a key press belongs to the text, not to walking.
 *
 * Deliberately narrow: a focused progress dot is *not* the UI in this sense, so
 * clicking a dot and then walking off with WASD still works.
 *
 * @param {(Element | null)[]} roots
 */
export function keyboardIsInUI(roots) {
  const active = document.activeElement;
  if (!active || active === document.body) return false;
  return roots.some((root) => root?.contains(active));
}
