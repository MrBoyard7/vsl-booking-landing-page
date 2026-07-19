# Setup guide

This page covers everything needed to go from "cloned repo" to "live site
with working integrations": MailerLite, Zoho CRM, the Microsoft Bookings
calendar embed, and deployment.

## 1. Local development

```bash
npm install
cp .env.example .env   # already provided in the zip with MOCK_INTEGRATIONS=true
npm start
```

Visit `http://localhost:3000`. In mock mode, submitting the form logs
`[MailerLite] Skipping…` / `[Zoho CRM] Skipping…` in the terminal and still
returns a success response to the visitor — so you can test the entire
front-end flow (validation, loading state, success/error messaging) without
any real API keys.

## 2. MailerLite

1. Log in to MailerLite → **Integrations → Developer API** → generate a
   token.
2. (Optional) create a group for landing-page leads and copy its ID.
3. In `.env`:
   ```
   MAILERLITE_API_KEY=your-token
   MAILERLITE_GROUP_ID=your-group-id
   MOCK_INTEGRATIONS=false
   ```
4. Submit the form locally — you should see the contact appear in
   MailerLite within a few seconds.

This project uses MailerLite's current Connect API
(`https://connect.mailerlite.com/api`, Bearer-token auth). If your account
is still on the legacy "Classic" API, see MailerLite's docs for the
older endpoint shape and swap it into `api/lib/mailerlite.js`.

## 3. Zoho CRM

Zoho CRM uses OAuth 2.0, not a static key, which means a few more steps:

1. Go to <https://api-console.zoho.com> and create a **Server-based
   Application**.
2. Generate a refresh token with the `ZohoCRM.modules.leads.CREATE` scope
   (Zoho's "Self Client" flow is the fastest way to do this for a
   single-server use case like this one).
3. In `.env`:
   ```
   ZOHO_CLIENT_ID=...
   ZOHO_CLIENT_SECRET=...
   ZOHO_REFRESH_TOKEN=...
   ZOHO_ACCOUNT_DOMAIN=https://accounts.zoho.com
   ZOHO_API_DOMAIN=https://www.zohoapis.com
   MOCK_INTEGRATIONS=false
   ```
4. **Data center matters.** If your Zoho account was created under the EU,
   India, or Australia data center, `ZOHO_ACCOUNT_DOMAIN` and
   `ZOHO_API_DOMAIN` must use the matching regional domain
   (`.eu`, `.in`, `.com.au`, ...), or every request fails with
   `INVALID_TOKEN` even with correct credentials.

`api/lib/zoho.js` refreshes the access token on every submission rather
than caching it, since serverless functions can't reliably persist state
between invocations. For very high traffic you'd want to cache the token
in something like Redis/Upstash for its ~1 hour lifetime — noted here
rather than built in, to avoid pulling in a paid dependency you didn't ask
for.

## 4. Calendar (Microsoft Bookings)

The brief asked for an embedded Outlook calendar. The actual product that
provides a bookable, embeddable calendar backed by Outlook/Microsoft 365 is
**Microsoft Bookings** (a read-only calendar view can be embedded, but it
can't take bookings — Bookings is what you want for "lock in a call
without leaving the page").

1. In Microsoft Bookings, open your booking page → **Booking page** →
   **Embed** → copy the `<iframe>` `src` URL.
2. In `src/index.html`, replace the placeholder:
   ```html
   <div
     class="calendar-embed"
     id="calendar-embed"
     data-embed-src="PASTE_YOUR_BOOKINGS_EMBED_URL_HERE"
   ></div>
   ```
3. That's it — `src/js/main.js` injects the iframe automatically, but only
   after the visitor accepts "booking" cookies in the consent banner (see
   below). This is intentional: Microsoft's iframe sets its own cookies, so
   loading it unconditionally would make the GDPR banner meaningless.

## 5. Cookie consent / GDPR

`src/js/cookie-consent.js` stores a simple `{ essential, booking,
timestamp }` object in `localStorage` — nothing is set before the visitor
chooses. "Reject non-essential" still lets the form work (email/CRM sync
are core to the service you're providing, not marketing trackers), it just
keeps the calendar iframe from loading.

If you add real analytics later (GA4, Plausible, Meta Pixel, ...), gate the
script tag behind the same `consent:updated` event so it stays GDPR-clean —
see the pattern already used for the calendar in `src/js/main.js`.

## 6. The video

See `src/assets/video/README.md` — drop `vsl.mp4` in that folder and update
the poster image. The player already handles a missing file gracefully, so
nothing breaks if you deploy before the video is ready.

## 7. Deployment (no extra subscription required)

The site is a static front end (`src/`) plus one small serverless function
(`api/submit-lead.js`). Any of these free tiers work:

- **Vercel** (recommended — zero config): `vercel deploy`, point the
  project root at this repo. Vercel auto-detects `api/*.js` as serverless
  functions and serves `src/` as the static root once you set the
  "Output Directory" to `src` in project settings (or run `npm run build`
  and point it at `dist/`, which additionally gets you minified CSS/JS).
- **Netlify**: same idea — set publish directory to `dist`, and move/alias
  `api/submit-lead.js` into `netlify/functions/` (Netlify's function
  routing convention differs slightly from Vercel's; a one-line adapter is
  enough, since the actual logic lives in `api/lib/`).
- **GitHub Pages**: static-only (no serverless functions), but the
  included `.github/workflows/deploy-pages.yml` gives you a free visual
  preview of the front end. You'd still need Vercel/Netlify's free tier (or
  your own server) for the working form.

In every case: set the environment variables from `.env.example` in the
host's dashboard, with `MOCK_INTEGRATIONS=false`.
