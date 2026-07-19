const { syncToZohoCRM } = require('../api/lib/zoho');

const lead = {
  firstName: 'Grace',
  lastName: 'Hopper',
  email: 'grace@example.com',
  company: 'US Navy',
  phone: '',
};

const fullConfig = {
  clientId: 'client-id',
  clientSecret: 'client-secret',
  refreshToken: 'refresh-token',
  accountDomain: 'https://accounts.zoho.com',
  apiDomain: 'https://www.zohoapis.com',
  mock: false,
};

describe('syncToZohoCRM', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('skips the real call when credentials are incomplete', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const result = await syncToZohoCRM(lead, { clientId: 'only-this-one', mock: false });

    expect(result).toEqual({ ok: true, skipped: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('skips the real call in mock mode even with full credentials', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    const result = await syncToZohoCRM(lead, { ...fullConfig, mock: true });

    expect(result).toEqual({ ok: true, skipped: true });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('refreshes the access token, then creates a Lead', async () => {
    global.fetch = jest
      .fn()
      // 1st call: OAuth token refresh
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'fresh-token' }),
      })
      // 2nd call: create Lead
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ data: [{ status: 'success' }] }),
      });

    const result = await syncToZohoCRM(lead, fullConfig);

    expect(result).toEqual({ ok: true, status: 201 });
    expect(global.fetch).toHaveBeenCalledTimes(2);

    const [leadUrl, leadRequest] = global.fetch.mock.calls[1];
    expect(leadUrl).toBe('https://www.zohoapis.com/crm/v2/Leads');
    expect(leadRequest.headers.Authorization).toBe('Zoho-oauthtoken fresh-token');
  });

  it('reports failure without throwing when the token refresh fails', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: () => Promise.resolve('invalid_client'),
    });

    const result = await syncToZohoCRM(lead, fullConfig);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Zoho token refresh failed');
  });

  it('reports failure without throwing when the Leads API call fails', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ access_token: 'fresh-token' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ code: 'MANDATORY_NOT_FOUND' }),
      });

    const result = await syncToZohoCRM(lead, fullConfig);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });
});
