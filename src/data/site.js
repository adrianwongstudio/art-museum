/**
 * Everything about the gallery itself, in one place, so there is exactly one
 * thing to change when this stops being a placeholder.
 */

export const site = {
  name: 'The Long Room',
  tagline: 'Eight works, one hall.',
  /** Where "Inquire" and the contact form go. Change this before launch. */
  email: 'hello@thelongroom.example',
  location: 'By appointment',
  phone: '+1 (000) 000 0000',
  address: ['14 Prospect Wharf', 'Vancouver, BC'],
  hours: [
    ['Tuesday – Friday', '11am – 6pm'],
    ['Saturday', '11am – 4pm'],
    ['Sunday – Monday', 'By appointment'],
  ],

  /**
   * Where the contact form posts. Leave null and the form hands the enquiry to
   * the visitor's own mail client, which needs no backend and no third party.
   * Set it to a URL that accepts JSON — a Cloudflare Worker, Formspree, whatever
   * you like — and the form will POST there instead, with no other changes.
   */
  contactEndpoint: null,
};

/** What the browser tab says. Also what a bookmark of a deep link is called. */
export function pageTitle(work, artistName) {
  if (!work) return `${site.name} — a gallery you can walk through`;
  return `${work.title} — ${artistName} · ${site.name}`;
}

/** A pre-filled enquiry about a specific work. */
export function inquiryLink(work, artistName) {
  const subject = `Enquiry: ${work.title} (${artistName}, ${work.year})`;
  const body = [
    `I would like to know more about "${work.title}" by ${artistName}.`,
    '',
    `Work: ${work.title}, ${work.year}`,
    `Medium: ${work.medium}`,
    '',
    '',
  ].join('\n');

  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
