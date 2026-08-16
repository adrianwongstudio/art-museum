/**
 * Everything about the gallery itself, in one place, so there is exactly one
 * thing to change when this stops being a placeholder.
 */

export const site = {
  name: 'The Long Room',
  tagline: 'Eight works, one hall.',
  /** Where "Inquire" goes. Change this before the site goes anywhere near a client. */
  email: 'hello@thelongroom.example',
  location: 'By appointment',
};

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
