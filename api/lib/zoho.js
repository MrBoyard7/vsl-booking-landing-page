/**
 * Zoho CRM integration.
 *
 * Zoho CRM authenticates with OAuth 2.0, not a static API key. This module
 * exchanges a long-lived refresh token for a short-lived access token
 * (valid ~1 hour) before every write, since serverless functions cannot
 * reliably cache state between invocations.
 *
 * Docs: https://www.zoho.com/crm/developer/docs/api/v2/
 *
 * NOTE ON API VERSION: this module targets the Zoho CRM v2 REST API, which
 * remains fully supported and is the version most tutorials/SDKs use as of
 * writing. Zoho has since introduced newer versions (v3+). If you provision
 * a fresh Zoho API console app, check the current recommended version in
 * Zoho's docs and update ZOHO_API_VERSION below if needed — the endpoint
 * shape (`/crm/{version}/Leads`) stays the same.
 *
 * NOTE ON DATA CENTER: Zoho has region-specific domains (.com, .eu, .in,
 * .com.au, ...). ZOHO_ACCOUNT_DOMAIN and ZOHO_API_DOMAIN in your .env MUST
 * match the data center your Zoho account was created in, or every request
 * will fail with an "INVALID_TOKEN" error even with valid credentials.
 */

const ZOHO_API_VERSION = 'v2';

/**
 * Exchanges a refresh token for a fresh access token.
 *
 * @param {{ clientId: string, clientSecret: string, refreshToken: string, accountDomain: string }} creds
 * @returns {Promise<string>} access token
 */
async function getAccessToken(creds) {
  const { clientId, clientSecret, refreshToken, accountDomain } = creds;

  const url = new URL('/oauth/v2/token', accountDomain);
  url.searchParams.set('refresh_token', refreshToken);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('client_secret', clientSecret);
  url.searchParams.set('grant_type', 'refresh_token');

  const response = await fetch(url.toString(), { method: 'POST' });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Zoho token refresh failed (${response.status}): ${body}`);
  }

  const json = await response.json();

  if (!json.access_token) {
    throw new Error('Zoho token refresh response did not include an access_token.');
  }

  return json.access_token;
}

/**
 * Creates a Lead record in Zoho CRM.
 *
 * @param {import('./validateLead').LeadPayload} lead
 * @param {{
 *   clientId?: string, clientSecret?: string, refreshToken?: string,
 *   accountDomain?: string, apiDomain?: string, mock?: boolean
 * }} config
 * @returns {Promise<{ ok: boolean, skipped?: boolean, status?: number, error?: string }>}
 */
async function syncToZohoCRM(lead, config) {
  const { clientId, clientSecret, refreshToken, accountDomain, apiDomain, mock } = config;

  const isConfigured = clientId && clientSecret && refreshToken;

  if (mock || !isConfigured) {
    console.warn(
      '[Zoho CRM] Skipping real API call (mock mode or ZOHO_* credentials missing).'
    );
    return { ok: true, skipped: true };
  }

  try {
    const accessToken = await getAccessToken({
      clientId,
      clientSecret,
      refreshToken,
      accountDomain: accountDomain || 'https://accounts.zoho.com',
    });

    const base = apiDomain || 'https://www.zohoapis.com';
    const response = await fetch(`${base}/crm/${ZOHO_API_VERSION}/Leads`, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [
          {
            First_Name: lead.firstName,
            Last_Name: lead.lastName,
            Email: lead.email,
            Company: lead.company || 'Unknown',
            Phone: lead.phone || undefined,
            Lead_Source: 'Landing Page',
            Description: 'Submitted via the booking form on the VSL landing page.',
          },
        ],
      }),
    });

    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(`[Zoho CRM] API error ${response.status}:`, json);
      return { ok: false, status: response.status, error: JSON.stringify(json) };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    console.error('[Zoho CRM] Request failed:', error);
    return { ok: false, error: error.message };
  }
}

module.exports = { syncToZohoCRM, getAccessToken, ZOHO_API_VERSION };
