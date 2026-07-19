/**
 * Pure validation logic for an incoming lead submission.
 *
 * Kept separate from the HTTP handler so it can be unit tested without
 * mocking `req`/`res` and reused by both the serverless function
 * (api/submit-lead.js) and the local Express server (server/local-server.js).
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * @typedef {Object} LeadPayload
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} [company]
 * @property {string} [phone]
 * @property {boolean} consent - Explicit GDPR marketing consent checkbox.
 */

/**
 * Validates a raw lead payload coming from the booking form.
 *
 * @param {Partial<LeadPayload>} data
 * @returns {{ valid: boolean, errors: Record<string, string>, data: LeadPayload | null }}
 */
function validateLeadPayload(data) {
  const errors = {};
  const source = data || {};

  const firstName = String(source.firstName || '').trim();
  const lastName = String(source.lastName || '').trim();
  const email = String(source.email || '').trim();
  const company = String(source.company || '').trim();
  const phone = String(source.phone || '').trim();
  const consent = source.consent === true || source.consent === 'true';

  if (firstName.length < 2) {
    errors.firstName = 'First name must be at least 2 characters long.';
  }

  if (lastName.length < 2) {
    errors.lastName = 'Last name must be at least 2 characters long.';
  }

  if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!consent) {
    errors.consent = 'You must accept the privacy policy to book a call.';
  }

  if (phone && phone.replace(/[^\d+]/g, '').length < 7) {
    errors.phone = 'Please enter a valid phone number, or leave it blank.';
  }

  const valid = Object.keys(errors).length === 0;

  return {
    valid,
    errors,
    data: valid ? { firstName, lastName, email, company, phone, consent } : null,
  };
}

module.exports = { validateLeadPayload, EMAIL_REGEX };
