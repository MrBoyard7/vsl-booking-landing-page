const { validateLeadPayload } = require('../api/lib/validateLead');

describe('validateLeadPayload', () => {
  const validPayload = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    company: 'Analytical Engines Ltd',
    phone: '+1 555 0100',
    consent: true,
  };

  it('accepts a fully valid payload', () => {
    const result = validateLeadPayload(validPayload);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.data).toMatchObject({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    });
  });

  it('trims whitespace from string fields', () => {
    const result = validateLeadPayload({ ...validPayload, firstName: '  Ada  ' });
    expect(result.data.firstName).toBe('Ada');
  });

  it('rejects a missing/short first name', () => {
    const result = validateLeadPayload({ ...validPayload, firstName: 'A' });
    expect(result.valid).toBe(false);
    expect(result.errors.firstName).toBeDefined();
  });

  it('rejects an invalid email address', () => {
    const result = validateLeadPayload({ ...validPayload, email: 'not-an-email' });
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it('requires explicit consent', () => {
    const result = validateLeadPayload({ ...validPayload, consent: false });
    expect(result.valid).toBe(false);
    expect(result.errors.consent).toBeDefined();
  });

  it('allows an empty optional phone number', () => {
    const result = validateLeadPayload({ ...validPayload, phone: '' });
    expect(result.valid).toBe(true);
  });

  it('rejects a clearly invalid phone number when one is provided', () => {
    const result = validateLeadPayload({ ...validPayload, phone: '123' });
    expect(result.valid).toBe(false);
    expect(result.errors.phone).toBeDefined();
  });

  it('handles a completely empty payload without throwing', () => {
    const result = validateLeadPayload({});
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThan(0);
  });
});
