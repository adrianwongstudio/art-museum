import { describe, expect, it } from 'vitest';

import { SUBJECTS, composeMailto, emptyEnquiry, validateEnquiry } from '../src/interaction/contactForm.js';

const good = () => ({
  ...emptyEnquiry(),
  name: 'Mireille Okonkwo',
  email: 'm@example.com',
  subject: SUBJECTS[0].value,
  message: 'I would like to arrange a viewing of the Banks works this month.',
});

describe('validateEnquiry', () => {
  it('accepts a complete enquiry', () => {
    const { valid, errors } = validateEnquiry(good());
    expect(valid).toBe(true);
    expect(errors).toEqual({});
  });

  it('needs a name', () => {
    expect(validateEnquiry({ ...good(), name: '' }).errors.name).toBeTruthy();
    expect(validateEnquiry({ ...good(), name: '   ' }).errors.name).toBeTruthy();
  });

  it('needs an email that could exist', () => {
    for (const email of ['', 'nope', 'a@', '@b.com', 'a@b', 'a b@c.com']) {
      expect(validateEnquiry({ ...good(), email }).errors.email, email).toBeTruthy();
    }
  });

  it('accepts the shapes real addresses take', () => {
    for (const email of ['a@b.co', 'first.last@sub.domain.org', 'someone+tag@example.museum']) {
      expect(validateEnquiry({ ...good(), email }).errors.email, email).toBeFalsy();
    }
  });

  it('needs a message with something in it', () => {
    expect(validateEnquiry({ ...good(), message: '' }).errors.message).toBeTruthy();
    expect(validateEnquiry({ ...good(), message: 'hi' }).errors.message).toBeTruthy();
  });

  it('refuses a subject it does not offer', () => {
    expect(validateEnquiry({ ...good(), subject: 'nonsense' }).errors.subject).toBeTruthy();
  });

  it('reports every problem at once, so the visitor fixes the form once', () => {
    const { valid, errors } = validateEnquiry({ ...emptyEnquiry(), subject: SUBJECTS[0].value });
    expect(valid).toBe(false);
    expect(Object.keys(errors).sort()).toEqual(['email', 'message', 'name']);
  });

  it('turns down anything that fills the honeypot, quietly and without a field error', () => {
    const { valid, errors, spam } = validateEnquiry({ ...good(), website: 'http://spam' });
    expect(valid).toBe(false);
    expect(spam).toBe(true);
    expect(errors).toEqual({});
  });

  it('has an opinion about absurdly long input', () => {
    expect(validateEnquiry({ ...good(), message: 'x'.repeat(5001) }).errors.message).toBeTruthy();
    expect(validateEnquiry({ ...good(), name: 'x'.repeat(201) }).errors.name).toBeTruthy();
  });
});

describe('composeMailto', () => {
  it('addresses the gallery and carries the enquiry', () => {
    const link = composeMailto(good(), 'hello@example.com');
    expect(link.startsWith('mailto:hello@example.com?')).toBe(true);
    expect(decodeURIComponent(link)).toContain('Mireille Okonkwo');
    expect(decodeURIComponent(link)).toContain('arrange a viewing');
  });

  it('puts the chosen subject in the subject line', () => {
    const link = composeMailto({ ...good(), subject: 'press' }, 'hello@example.com');
    expect(decodeURIComponent(link)).toContain(SUBJECTS.find((s) => s.value === 'press').label);
  });

  it('encodes characters that would otherwise break the link', () => {
    const link = composeMailto({ ...good(), message: 'a&b=c d' }, 'hello@example.com');
    expect(link).not.toContain('a&b=c d');
    expect(decodeURIComponent(link)).toContain('a&b=c d');
  });
});
