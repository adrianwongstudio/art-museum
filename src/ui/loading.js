/**
 * The door: a progress bar while the works load, then the way in.
 */

export function createLoading({ root, onEnter }) {
  const fill = root.querySelector('#loading-fill');
  const percent = root.querySelector('#loading-pct');
  const bar = root.querySelector('.loading__bar');
  const button = root.querySelector('#enter');

  let shown = 0;
  let ready = false;

  button.addEventListener('click', () => {
    if (!ready) return;
    root.classList.add('is-gone');
    setTimeout(() => {
      root.hidden = true;
    }, 700);
    onEnter?.();
  });

  return {
    /** @param {number} value 0–1 */
    setProgress(value) {
      // Only ever move forward: loaders report in bursts and going backwards looks broken.
      shown = Math.max(shown, Math.min(1, value));
      const pct = Math.round(shown * 100);
      fill.style.transform = `scaleX(${shown})`;
      percent.textContent = `${pct}%`;
      bar.setAttribute('aria-valuenow', String(pct));

      if (shown >= 1 && !ready) {
        ready = true;
        button.disabled = false;
        button.focus();
      }
    },

    get isReady() {
      return ready;
    },
  };
}
