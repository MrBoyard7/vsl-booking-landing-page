const { syncToMailerLite, MAILERLITE_BASE_URL } = require('../api/lib/mailerlite');

const lead = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  company: 'Analytical Engines Ltd',
  phone: '',
};

describe('syncToMailerLite', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('skips the real call when no API key is configured', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const result = await syncToMailerLite(lead, { apiKey: undefined, mock: false });

    expect(result).toEqual({ ok: true, skipped: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('skips the real call in mock mode even with an API key present', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const result = await syncToMailerLite(lead, { apiKey: 'fake-key', mock: true });

    expect(result).toEqual({ ok: true, skipped: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('calls the MailerLite API with a Bearer token when configured', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    const result = await syncToMailerLite(lead, {
      apiKey: 'real-key',
      groupId: 'group-123',
      mock: false,
    });

    expect(result).toEqual({ ok: true, status: 200 });
    expect(global.fetch).toHaveBeenCalledWith(
      `${MAILERLITE_BASE_URL}/subscribers`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer real-key' }),
      })
    );
  });

  it('reports failure without throwing when the API responds with an error', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: () => Promise.resolve('{"error":"invalid email"}'),
    });

    const result = await syncToMailerLite(lead, { apiKey: 'real-key', mock: false });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(422);
  });

  it('reports failure without throwing when the network request itself fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    const result = await syncToMailerLite(lead, { apiKey: 'real-key', mock: false });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('network down');
  });
});
