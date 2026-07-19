const { handleLeadSubmission } = require('../api/lib/handleLeadSubmission');

const validPayload = {
  firstName: 'Grace',
  lastName: 'Hopper',
  email: 'grace@example.com',
  company: 'US Navy',
  phone: '',
  consent: true,
};

describe('handleLeadSubmission', () => {
  it('returns 422 and never touches the network when the payload is invalid', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');

    const { status, body } = await handleLeadSubmission(
      { ...validPayload, email: 'invalid' },
      { MOCK_INTEGRATIONS: 'true' }
    );

    expect(status).toBe(422);
    expect(body.ok).toBe(false);
    expect(body.errors.email).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('returns 200 with skipped integrations in mock mode', async () => {
    const { status, body } = await handleLeadSubmission(validPayload, {
      MOCK_INTEGRATIONS: 'true',
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.integrations.mailerlite).toEqual({ ok: true, skipped: true });
    expect(body.integrations.zohoCrm).toEqual({ ok: true, skipped: true });
  });

  it('returns 200 with skipped integrations when credentials are simply absent (non-mock env)', async () => {
    const { status, body } = await handleLeadSubmission(validPayload, {});

    expect(status).toBe(200);
    expect(body.integrations.mailerlite.skipped).toBe(true);
    expect(body.integrations.zohoCrm.skipped).toBe(true);
  });
});
