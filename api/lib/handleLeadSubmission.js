const { validateLeadPayload } = require('./validateLead');
const { syncToMailerLite } = require('./mailerlite');
const { syncToZohoCRM } = require('./zoho');

/**
 * Reads integration configuration from environment variables.
 * Centralised here so the handler and local server build the same shape.
 *
 * @param {NodeJS.ProcessEnv} env
 */
function loadConfigFromEnv(env) {
  const mock = env.MOCK_INTEGRATIONS === 'true';

  return {
    mock,
    mailerlite: {
      apiKey: env.MAILERLITE_API_KEY,
      groupId: env.MAILERLITE_GROUP_ID,
      mock,
    },
    zoho: {
      clientId: env.ZOHO_CLIENT_ID,
      clientSecret: env.ZOHO_CLIENT_SECRET,
      refreshToken: env.ZOHO_REFRESH_TOKEN,
      accountDomain: env.ZOHO_ACCOUNT_DOMAIN,
      apiDomain: env.ZOHO_API_DOMAIN,
      mock,
    },
  };
}

/**
 * Validates a raw submission and, if valid, pushes it to MailerLite and
 * Zoho CRM in parallel. A failure in one integration never blocks the
 * other, and never blocks the visitor's booking confirmation — both
 * results are simply reported back so the caller can log/alert on them.
 *
 * @param {unknown} rawBody
 * @param {NodeJS.ProcessEnv} env
 */
async function handleLeadSubmission(rawBody, env) {
  const { valid, errors, data } = validateLeadPayload(rawBody);

  if (!valid) {
    return { status: 422, body: { ok: false, errors } };
  }

  const config = loadConfigFromEnv(env);

  const [mailerliteResult, zohoResult] = await Promise.all([
    syncToMailerLite(data, config.mailerlite),
    syncToZohoCRM(data, config.zoho),
  ]);

  // We still return 200 even if a downstream CRM/ESP call failed: the
  // visitor successfully reserved their slot, and that's what matters to
  // them. The integration results are returned for logging/observability,
  // not surfaced as an error to the end user.
  return {
    status: 200,
    body: {
      ok: true,
      integrations: {
        mailerlite: mailerliteResult,
        zohoCrm: zohoResult,
      },
    },
  };
}

module.exports = { handleLeadSubmission, loadConfigFromEnv };
