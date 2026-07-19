/**
 * Serverless entry point for the lead capture form.
 *
 * Written against the Vercel Node.js function signature (`req`, `res`) which
 * Netlify Functions can also run with a thin adapter, or which you can copy
 * almost as-is into an Express route (see server/local-server.js, which does
 * exactly that for local development).
 *
 * Deployment: drop this file (and the `api/lib` folder) into a Vercel
 * project's `/api` directory and it becomes `POST /api/submit-lead`
 * automatically — no extra configuration, no paid plan required.
 */

const { handleLeadSubmission } = require('./lib/handleLeadSubmission');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ ok: false, error: 'Method Not Allowed' });
    return;
  }

  try {
    const { status, body } = await handleLeadSubmission(req.body, process.env);
    res.status(status).json(body);
  } catch (error) {
    console.error('[submit-lead] Unexpected error:', error);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
};
