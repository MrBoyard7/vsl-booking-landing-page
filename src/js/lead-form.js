/**
 * Booking form: client-side validation + submission to /api/submit-lead.
 *
 * The validation rules here intentionally mirror api/lib/validateLead.js.
 * This copy exists purely for instant feedback in the browser — the
 * server-side copy is the one that's actually trusted, and re-validates
 * everything independently.
 */
(function () {
  'use strict';

  var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * @param {Record<string, string | boolean>} values
   * @returns {{ valid: boolean, errors: Record<string, string> }}
   */
  function validateClientForm(values) {
    var errors = {};

    if (!values.firstName || String(values.firstName).trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters long.';
    }

    if (!values.lastName || String(values.lastName).trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters long.';
    }

    if (!values.email || !EMAIL_REGEX.test(String(values.email).trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!values.consent) {
      errors.consent = 'You must accept the privacy policy to book a call.';
    }

    var phone = values.phone ? String(values.phone).trim() : '';
    if (phone && phone.replace(/[^\d+]/g, '').length < 7) {
      errors.phone = 'Please enter a valid phone number, or leave it blank.';
    }

    return { valid: Object.keys(errors).length === 0, errors: errors };
  }

  var api = { validateClientForm: validateClientForm };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (typeof document === 'undefined') return;

  function init() {
    var form = document.getElementById('lead-form');
    var statusEl = document.getElementById('lead-form-status');
    var submitBtn = document.getElementById('lead-form-submit');
    if (!form || !statusEl || !submitBtn) return;

    function readValues() {
      var data = new FormData(form);
      return {
        firstName: data.get('firstName'),
        lastName: data.get('lastName'),
        email: data.get('email'),
        company: data.get('company'),
        phone: data.get('phone'),
        consent: form.querySelector('#consent').checked,
      };
    }

    function renderErrors(errors) {
      form.querySelectorAll('.field__error').forEach(function (el) {
        el.textContent = '';
      });
      Object.keys(errors).forEach(function (field) {
        var el = form.querySelector('[data-error-for="' + field + '"]');
        if (el) el.textContent = errors[field];
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var values = readValues();
      var result = validateClientForm(values);
      renderErrors(result.errors);

      if (!result.valid) {
        statusEl.dataset.state = 'error';
        statusEl.textContent = 'Please fix the highlighted fields.';
        return;
      }

      submitBtn.disabled = true;
      statusEl.dataset.state = '';
      statusEl.textContent = 'Reserving your seat…';

      fetch('/api/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
        .then(function (response) {
          return response.json().then(function (body) {
            return { ok: response.ok, body: body };
          });
        })
        .then(function (result) {
          if (!result.ok) {
            throw new Error(
              (result.body && result.body.errors && JSON.stringify(result.body.errors)) ||
                'Submission failed.'
            );
          }
          statusEl.dataset.state = 'success';
          statusEl.textContent = "You're booked in — check your email for the confirmation.";
          form.reset();
        })
        .catch(function (error) {
          console.error('[lead-form] submission failed:', error);
          statusEl.dataset.state = 'error';
          statusEl.textContent = 'Something went wrong. Please try again in a moment.';
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
