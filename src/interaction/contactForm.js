/**
 * The enquiry form's rules.
 *
 * Pure: it validates a set of values and composes the message. Whether that
 * message goes out through the visitor's mail client or a POST endpoint is
 * decided in ui/pages/contact.js, from one setting in data/site.js.
 */

export const SUBJECTS = [
  { value: 'work', label: 'Enquiry about a work' },
  { value: 'visit', label: 'Arranging a viewing' },
  { value: 'artist', label: 'Working with an artist' },
  { value: 'press', label: 'Press and publication' },
  { value: 'other', label: 'Something else' },
];

const LIMITS = { name: 200, email: 254, message: 5000 };

/**
 * Deliberately loose. Anything stricter starts rejecting real addresses, and the
 * only test that actually settles it is whether the reply arrives.
 */
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function emptyEnquiry() {
  return { name: '', email: '', subject: SUBJECTS[0].value, message: '', website: '' };
}

export function validateEnquiry(values) {
  // `website` is a honeypot: it is hidden from people and irresistible to bots.
  // A filled one is dropped without a word, because telling a bot what gave it
  // away only helps the bot.
  if (String(values.website ?? '').trim()) {
    return { valid: false, spam: true, errors: {} };
  }

  const errors = {};
  const name = String(values.name ?? '').trim();
  const email = String(values.email ?? '').trim();
  const message = String(values.message ?? '').trim();

  if (!name) errors.name = 'Please tell us your name.';
  else if (name.length > LIMITS.name) errors.name = 'That name is longer than we can store.';

  if (!email) errors.email = 'We need an address to reply to.';
  else if (email.length > LIMITS.email || !EMAIL.test(email)) {
    errors.email = 'That does not look like an email address.';
  }

  if (!SUBJECTS.some((subject) => subject.value === values.subject)) {
    errors.subject = 'Please choose what this is about.';
  }

  if (message.length < 10) errors.message = 'A sentence or two, so we can help properly.';
  else if (message.length > LIMITS.message) errors.message = 'Please keep it under 5,000 characters.';

  return { valid: Object.keys(errors).length === 0, spam: false, errors };
}

export function subjectLabel(value) {
  return SUBJECTS.find((subject) => subject.value === value)?.label ?? 'Enquiry';
}

/** The enquiry as an email the visitor's own client will open, ready to send. */
export function composeMailto(values, address) {
  const subject = `${subjectLabel(values.subject)} — ${values.name}`;
  const body = [
    values.message,
    '',
    '—',
    `From: ${values.name}`,
    `Reply to: ${values.email}`,
    `About: ${subjectLabel(values.subject)}`,
  ].join('\n');

  return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
