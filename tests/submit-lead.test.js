const handler = require('../api/submit-lead');

function createRes() {
  const res = {
    statusCode: null,
    body: null,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

const validPayload = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  company: 'Analytical Engines Ltd',
  phone: '',
  consent: true,
};

describe('submit-lead handler', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, MOCK_INTEGRATIONS: 'true' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects non-POST methods with 405', async () => {
    const req = { method: 'GET' };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.headers.Allow).toBe('POST');
    expect(res.body).toEqual({ ok: false, error: 'Method Not Allowed' });
  });

  it('returns 200 for a valid submission', async () => {
    const req = { method: 'POST', body: validPayload };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('returns 422 for an invalid submission', async () => {
    const req = { method: 'POST', body: { firstName: 'A' } };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.body.ok).toBe(false);
  });

  it('returns 500 if something throws unexpectedly', async () => {
    // Force an unexpected failure: a non-object body makes handleLeadSubmission's
    // internals blow up before validation even runs, exercising the catch block.
    const req = {
      method: 'POST',
      get body() {
        throw new Error('boom');
      },
    };
    const res = createRes();

    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ ok: false, error: 'Internal Server Error' });
  });
});
