/**
 * Local development server.
 *
 * Serves the static site from /src and mounts the same lead-submission
 * logic used in production (api/lib/handleLeadSubmission.js) at
 * POST /api/submit-lead, so `npm start` gives you a fully working replica
 * of the deployed site on http://localhost:3000.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const { handleLeadSubmission } = require('../api/lib/handleLeadSubmission');

/**
 * Minimal .env loader so local dev works without adding the `dotenv`
 * dependency just for a handful of key=value lines. Silently does nothing
 * if no .env file exists (e.g. in CI, where env vars are injected directly).
 */
function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const contents = fs.readFileSync(filePath, 'utf8');
  contents.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    value = value.replace(/^["']|["']$/g, '');

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}

loadDotEnv(path.join(__dirname, '..', '.env'));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'src')));

app.post('/api/submit-lead', async (req, res) => {
  try {
    const { status, body } = await handleLeadSubmission(req.body, process.env);
    res.status(status).json(body);
  } catch (error) {
    console.error('[submit-lead] Unexpected error:', error);
    res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Local server ready:  http://localhost:${PORT}`);
  console.log(
    process.env.MOCK_INTEGRATIONS === 'true'
      ? 'Running in MOCK mode — MailerLite/Zoho calls are simulated.'
      : 'Running with real integration credentials from .env (if present).'
  );
});
