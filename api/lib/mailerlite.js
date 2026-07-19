/**
 * MailerLite integration.
 *
 * Uses the current MailerLite Connect REST API (Bearer token auth).
 * Docs: https://developers.mailerlite.com/docs/
 *
 * NOTE: MailerLite retired the old "X-MailerLite-ApiKey" v2 API in favor of
 * Bearer-token auth against https://connect.mailerlite.com/api. If you are
 * still on a legacy MailerLite Classic account, check the "Classic API"
 * section of their docs — the endpoint and payload shape differ slightly.
 */

const MAILERLITE_BASE_URL = 'https://connect.mailerlite.com/api';

/**
 * Creates or updates a subscriber in MailerLite.
 *
 * @param {import('./validateLead').LeadPayload} lead
 * @param {{ apiKey?: string, groupId?: string, mock?: boolean }} config
 * @returns {Promise<{ ok: boolean, skipped?: boolean, status?: number, error?: string }>}
 */
async function syncToMailerLite(lead, config) {
  const { apiKey, groupId, mock } = config;

  if (mock || !apiKey) {
    // Local/dev mode, or the integration simply isn't configured yet.
    // We never want a missing key to crash the booking flow in production,
    // so we log and move on instead of throwing.
    console.warn(
      '[MailerLite] Skipping real API call (mock mode or MAILERLITE_API_KEY missing).'
    );
    return { ok: true, skipped: true };
  }

  try {
    const response = await fetch(`${MAILERLITE_BASE_URL}/subscribers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: lead.email,
        fields: {
          name: lead.firstName,
          last_name: lead.lastName,
          company: lead.company || undefined,
          phone: lead.phone || undefined,
        },
        groups: groupId ? [groupId] : undefined,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[MailerLite] API error ${response.status}: ${body}`);
      return { ok: false, status: response.status, error: body };
    }

    return { ok: true, status: response.status };
  } catch (error) {
    console.error('[MailerLite] Request failed:', error);
    return { ok: false, error: error.message };
  }
}

module.exports = { syncToMailerLite, MAILERLITE_BASE_URL };
