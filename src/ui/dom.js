/**
 * The three lines of DOM helper the overlays need. Not a framework.
 */

export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else node.setAttribute(key, value === true ? '' : value);
  }

  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }

  return node;
}

export function clear(node) {
  while (node.firstChild) node.firstChild.remove();
  return node;
}

/** Small image button used in the "more by" and "similar" rows. */
export function thumbnail(work, onClick) {
  return el(
    'button',
    {
      class: 'thumb',
      type: 'button',
      title: `${work.title}, ${work.year}`,
      onclick: () => onClick(work),
    },
    [
      el('img', { src: work.image, alt: '', loading: 'lazy' }),
      el('span', { class: 'thumb__label', text: work.title }),
    ],
  );
}
