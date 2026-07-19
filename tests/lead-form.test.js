/**
 * @jest-environment jsdom
 */

const { validateClientForm } = require('../src/js/lead-form');

const validValues = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  company: 'Analytical Engines Ltd',
  phone: '',
  consent: true,
};

describe('validateClientForm (pure function)', () => {
  it('accepts fully valid values', () => {
    expect(validateClientForm(validValues)).toEqual({ valid: true, errors: {} });
  });

  it('rejects a missing email', () => {
    const result = validateClientForm({ ...validValues, email: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it('rejects when consent is not checked', () => {
    const result = validateClientForm({ ...validValues, consent: false });
    expect(result.valid).toBe(false);
    expect(result.errors.consent).toBeDefined();
  });

  it('allows the optional phone field to be blank', () => {
    const result = validateClientForm({ ...validValues, phone: '' });
    expect(result.valid).toBe(true);
  });
});

describe('lead form (DOM wiring)', () => {
  function renderForm() {
    document.body.innerHTML = `
      <form id="lead-form">
        <input id="firstName" name="firstName" />
        <p class="field__error" data-error-for="firstName"></p>

        <input id="lastName" name="lastName" />
        <p class="field__error" data-error-for="lastName"></p>

        <input id="email" name="email" />
        <p class="field__error" data-error-for="email"></p>

        <input id="company" name="company" />

        <input id="phone" name="phone" />
        <p class="field__error" data-error-for="phone"></p>

        <input id="consent" type="checkbox" />
        <p class="field__error" data-error-for="consent"></p>

        <button id="lead-form-submit" type="submit">Reserve my seat</button>
        <p id="lead-form-status"></p>
      </form>
    `;
  }

  function fillValidForm() {
    document.getElementById('firstName').value = 'Ada';
    document.getElementById('lastName').value = 'Lovelace';
    document.getElementById('email').value = 'ada@example.com';
    document.getElementById('company').value = 'Analytical Engines Ltd';
    document.getElementById('phone').value = '';
    document.getElementById('consent').checked = true;
  }

  function submitForm() {
    const form = document.getElementById('lead-form');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }

  beforeEach(() => {
    renderForm();
    jest.resetModules();
    require('../src/js/lead-form');
  });

  afterEach(() => {
    delete global.fetch;
  });

  it('does nothing and does not throw if the form markup is missing', () => {
    document.body.innerHTML = '';
    expect(() => {
      jest.resetModules();
      require('../src/js/lead-form');
    }).not.toThrow();
  });

  it('blocks submission and renders errors when the form is invalid', () => {
    global.fetch = jest.fn();

    submitForm();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(document.querySelector('[data-error-for="email"]').textContent).toMatch(
      /valid email/i
    );
    expect(document.getElementById('lead-form-status').textContent).toMatch(
      /fix the highlighted/i
    );
    expect(document.getElementById('lead-form-status').dataset.state).toBe('error');
  });

  it('submits to /api/submit-lead and shows a success message', async () => {
    fillValidForm();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    });

    submitForm();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/submit-lead',
      expect.objectContaining({ method: 'POST' })
    );
    const sentBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(sentBody.email).toBe('ada@example.com');

    expect(document.getElementById('lead-form-status').dataset.state).toBe('success');
    expect(document.getElementById('lead-form-status').textContent).toMatch(/booked in/i);
    expect(document.getElementById('lead-form-submit').disabled).toBe(false);
  });

  it('shows an error message when the server rejects the submission', async () => {
    fillValidForm();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ ok: false, errors: { email: 'taken' } }),
    });

    submitForm();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.getElementById('lead-form-status').dataset.state).toBe('error');
    expect(document.getElementById('lead-form-status').textContent).toMatch(
      /something went wrong/i
    );
  });

  it('shows an error message when the network request itself fails', async () => {
    fillValidForm();
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    submitForm();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(document.getElementById('lead-form-status').dataset.state).toBe('error');
    expect(document.getElementById('lead-form-submit').disabled).toBe(false);
  });
});
