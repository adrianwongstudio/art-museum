/**
 * The contact page.
 *
 * Built on the bones of the Shaolin Hung Gar about page — eyebrow, large
 * heading, lede, a two-column band of text against a panel, a tinted strip of
 * three short columns, and the details at the end — but set in the gallery's own
 * language: serif display type, a single terracotta accent, and a lot of air.
 *
 * The form works. With no endpoint configured it hands a composed message to the
 * visitor's own mail client, which needs no backend and no third party; set
 * `site.contactEndpoint` and it POSTs JSON there instead.
 */

import { artists } from '../../data/artists.js';
import { inquiryLink, site } from '../../data/site.js';
import { hangings } from '../../data/gallery.js';
import {
  SUBJECTS,
  composeMailto,
  emptyEnquiry,
  validateEnquiry,
} from '../../interaction/contactForm.js';
import { el } from '../dom.js';

function field({ id, label, hint, control }) {
  return el('div', { class: 'field' }, [
    el('label', { class: 'field__label', for: id, text: label }),
    hint ? el('p', { class: 'field__hint', id: `${id}-hint`, text: hint }) : null,
    control,
    el('p', { class: 'field__error', id: `${id}-error`, role: 'alert' }),
  ]);
}

function buildForm() {
  const values = emptyEnquiry();
  const form = el('form', { class: 'enquiry', novalidate: true });
  const status = el('p', { class: 'enquiry__status', role: 'status', 'aria-live': 'polite' });

  const inputs = {};

  /** Keep the node and the values object in step, and remember it for validation. */
  const bind = (node, key) => {
    node.addEventListener('input', () => {
      values[key] = node.value;
    });
    node.addEventListener('change', () => {
      values[key] = node.value;
    });
    inputs[key] = node;
    return node;
  };

  const nameInput = bind(
    el('input', { id: 'enq-name', type: 'text', name: 'name', autocomplete: 'name' }),
    'name',
  );

  const emailInput = bind(
    el('input', { id: 'enq-email', type: 'email', name: 'email', autocomplete: 'email' }),
    'email',
  );

  const subjectInput = bind(
    el(
      'select',
      { id: 'enq-subject', name: 'subject' },
      SUBJECTS.map(({ value, label }) => el('option', { value, text: label })),
    ),
    'subject',
  );

  const messageInput = bind(
    el('textarea', { id: 'enq-message', name: 'message', rows: '6' }),
    'message',
  );

  // The honeypot. Hidden from people, and left alone by anyone who can see.
  const honeypot = el('input', {
    id: 'enq-website',
    type: 'text',
    name: 'website',
    tabindex: '-1',
    autocomplete: 'off',
    'aria-hidden': 'true',
  });
  honeypot.addEventListener('input', () => {
    values.website = honeypot.value;
  });

  function showErrors(errors) {
    for (const [key, node] of Object.entries(inputs)) {
      const message = errors[key];
      const errorNode = form.querySelector(`#${node.id}-error`);
      node.setAttribute('aria-invalid', message ? 'true' : 'false');
      node.classList.toggle('is-invalid', Boolean(message));
      if (errorNode) errorNode.textContent = message ?? '';
    }

    const firstBroken = Object.keys(inputs).find((key) => errors[key]);
    if (firstBroken) inputs[firstBroken].focus();
  }

  async function send(event) {
    event.preventDefault();
    status.textContent = '';
    status.className = 'enquiry__status';

    const { valid, errors, spam } = validateEnquiry(values);
    showErrors(errors);

    // A bot filled the honeypot. Say the same thing a success would say, and do
    // nothing at all.
    if (spam) {
      form.replaceWith(thanks());
      return;
    }

    if (!valid) {
      status.textContent = 'Please check the fields marked above.';
      status.classList.add('is-error');
      return;
    }

    if (!site.contactEndpoint) {
      // No backend: hand the finished message to the visitor's mail client.
      window.location.href = composeMailto(values, site.email);
      status.textContent =
        'Your email program should be opening with this message ready to send.';
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = 'Sending…';

    try {
      const response = await fetch(site.contactEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          subject: values.subject,
          message: values.message,
        }),
      });
      if (!response.ok) throw new Error(String(response.status));
      form.replaceWith(thanks());
    } catch {
      button.disabled = false;
      status.textContent = `That did not go through. Please email ${site.email} directly.`;
      status.classList.add('is-error');
    }
  }

  form.addEventListener('submit', send);

  form.append(
    field({ id: 'enq-name', label: 'Your name', control: nameInput }),
    field({ id: 'enq-email', label: 'Email', control: emailInput }),
    field({ id: 'enq-subject', label: 'What is this about?', control: subjectInput }),
    field({
      id: 'enq-message',
      label: 'Message',
      hint: 'If you are asking about a particular work, its title helps.',
      control: messageInput,
    }),
    el('div', { class: 'enquiry__honeypot', 'aria-hidden': 'true' }, [
      el('label', { for: 'enq-website', text: 'Website' }),
      honeypot,
    ]),
    el('div', { class: 'enquiry__actions' }, [
      el('button', { class: 'btn btn--primary', type: 'submit', text: 'Send enquiry' }),
      status,
    ]),
  );

  return form;
}

function thanks() {
  return el('div', { class: 'enquiry__thanks' }, [
    el('h3', { text: 'Thank you — that reached us.' }),
    el('p', {
      text: 'Someone will write back within two working days. If it is urgent, the phone number below is answered during opening hours.',
    }),
  ]);
}

export function renderContactPage() {
  const featured = hangings[3]?.work ?? hangings[0].work;

  return el('div', { class: 'page page--contact' }, [
    el('header', { class: 'pagehead' }, [
      el('p', { class: 'eyebrow', text: 'Get in touch' }),
      el('h1', { class: 'pagehead__title', text: 'Contact' }),
      el('p', {
        class: 'pagehead__lede',
        text: 'A small gallery in one long room. Write to us about a work, arrange a viewing, or ask after an artist.',
      }),
    ]),

    el('div', { class: 'twoup' }, [
      el('div', { class: 'twoup__text' }, [
        el('p', {
          text: 'The Long Room shows four artists at a time and keeps the hang up for a season, which means there is usually someone here who has spoken to the maker of whatever caught your eye.',
        }),
        el('p', {
          text: 'Everything on the walls is for sale. Prices are on the placards and on this site, and they are the prices — there is no separate list for people who ask.',
        }),
        el('p', {
          text: 'If you cannot visit, we will send additional photographs, condition notes and a scale drawing of the work in a room the size of yours.',
        }),
      ]),
      el('div', { class: 'twoup__panel' }, [
        el('img', { src: featured.image, alt: '', loading: 'lazy' }),
      ]),
    ]),

    el('section', { class: 'band' }, [
      el('h2', { class: 'band__title', text: 'How we work' }),
      el('div', { class: 'band__columns' }, [
        el('div', {}, [
          el('h3', { text: 'Viewings' }),
          el('p', {
            text: 'Walk in during opening hours, or ask for an hour alone with the work outside them.',
          }),
        ]),
        el('div', {}, [
          el('h3', { text: 'Acquiring' }),
          el('p', {
            text: 'A week to live with a piece before you decide, and we arrange crating and delivery.',
          }),
        ]),
        el('div', {}, [
          el('h3', { text: 'Artists' }),
          el('p', {
            text: `We show ${artists.length} artists a season and read every submission, slowly.`,
          }),
        ]),
      ]),
    ]),

    el('section', { class: 'contactmain' }, [
      el('div', { class: 'contactmain__form' }, [
        el('h2', { class: 'contactmain__title', text: 'Write to us' }),
        buildForm(),
      ]),

      el('aside', { class: 'contactmain__details' }, [
        el('h2', { class: 'contactmain__title', text: 'Find us' }),

        el('dl', { class: 'details' }, [
          el('dt', { text: 'Email' }),
          el('dd', {}, [el('a', { href: `mailto:${site.email}`, text: site.email })]),
          el('dt', { text: 'Telephone' }),
          el('dd', { text: site.phone }),
          el('dt', { text: 'Address' }),
          el('dd', { text: site.address.join(', ') }),
        ]),

        el('h3', { class: 'details__subhead', text: 'Opening hours' }),
        el(
          'dl',
          { class: 'details details--hours' },
          site.hours.flatMap(([days, time]) => [el('dt', { text: days }), el('dd', { text: time })]),
        ),

        el('p', { class: 'details__note' }, [
          'Enquiring about something specific? ',
          el('a', {
            href: inquiryLink(featured, ''),
            text: 'Every work has its own enquiry link',
          }),
          ' on its page in the room.',
        ]),
      ]),
    ]),
  ]);
}
