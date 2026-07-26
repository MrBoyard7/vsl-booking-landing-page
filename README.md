# VSL Booking Landing Page

[![CI](https://github.com/MrBoyard7/vsl-booking-landing-page/actions/workflows/ci.yml/badge.svg)](https://github.com/MrBoyard7/vsl-booking-landing-page/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/MrBoyard7/vsl-booking-landing-page/branch/main/graph/badge.svg)](https://codecov.io/gh/MrBoyard7/vsl-booking-landing-page)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](package.json)
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](.prettierrc)
[![Linter: ESLint](https://img.shields.io/badge/lint-eslint-4B32C3?logo=eslint&logoColor=white)](.eslintrc.json)
[![GDPR ready](https://img.shields.io/badge/GDPR-ready-2F6F62)](docs/SETUP.md#5-cookie-consent--gdpr)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A mobile-first, high-performance landing page that combines an above-the-fold
video sales letter, an embedded booking calendar, and a lead form that syncs
straight into **MailerLite** and **Zoho CRM**. Built with plain HTML/CSS/JS —
no framework, no build-step lock-in, no monthly tooling subscription.

> **Note on badges:** the CI and Codecov badges above go green automatically
> the first time this repo is pushed to GitHub and Codecov is connected
> (both are free for public repositories). Until then they'll show
> "no status" / "unknown" — see [Testing](#testing) to run everything
> locally in the meantime.

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Testing](#testing)
- [Configuring the integrations](#configuring-the-integrations)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Video sales letter above the fold** — muted autoplay with a graceful
  tap-to-play fallback for browsers/mobile OSes that block autoplay, fully
  custom controls (play/pause, scrubber, mute), and a clean "coming soon"
  state if the video file isn't present yet.
- **Live booking calendar** — Microsoft Bookings embed, lazy-loaded only
  after the visitor accepts booking cookies.
- **Dual lead sync** — one form submission fans out in parallel to
  MailerLite (to trigger your existing automation) and Zoho CRM (as a new
  Lead), independently fault-tolerant: a hiccup in one never blocks the
  other or the visitor's confirmation.
- **GDPR-friendly cookie consent** — no non-essential cookie is set before
  the visitor chooses; "reject" still lets the booking form work.
- **Mobile-first, sub-3-second target** — no CSS/JS framework, minified
  production build, lazy-loaded media, preconnected fonts.
- **Basic on-page SEO** — meta description, canonical tag, Open Graph /
  Twitter Card tags, JSON-LD structured data, `robots.txt`, `sitemap.xml`.
- **Fully tested** — unit tests for every piece of business logic
  (validation, MailerLite, Zoho CRM, cookie consent) _and_ DOM-level tests
  for the front end (video player, calendar consent-gating, form
  submission), runnable without any real API credentials via a built-in
  mock mode. ~97% line coverage at the time of writing — see the Codecov
  badge above for the current number.

## Tech stack

| Layer        | Choice                                                                           |
| ------------ | -------------------------------------------------------------------------------- |
| Markup/style | Semantic HTML5, vanilla CSS (custom properties, Grid)                            |
| Behaviour    | Vanilla JavaScript (ES2018, no framework)                                        |
| Backend      | A single Node.js serverless function (Vercel-style handler, reusable on Netlify) |
| Local dev    | Express (static file serving + the same API route)                               |
| Testing      | Jest (+ jsdom for DOM-level tests)                                               |
| Linting      | ESLint + Prettier                                                                |
| Build        | esbuild (minification only — no bundler needed)                                  |
| CI/CD        | GitHub Actions, Codecov, optional GitHub Pages preview                           |

## Project structure

```
.
├── .github/workflows/
│   ├── ci.yml                 # lint, format check, tests + coverage, build
│   └── deploy-pages.yml       # optional free static preview on GitHub Pages
├── api/
│   ├── lib/
│   │   ├── handleLeadSubmission.js   # orchestrates validation + both integrations
│   │   ├── mailerlite.js             # MailerLite Connect API client
│   │   ├── validateLead.js           # server-side validation (source of truth)
│   │   └── zoho.js                   # Zoho CRM API client (OAuth token refresh)
│   └── submit-lead.js         # serverless entry point: POST /api/submit-lead
├── docs/
│   └── SETUP.md               # MailerLite / Zoho / calendar / deployment guide
├── server/
│   └── local-server.js        # Express server for local dev (mirrors production)
├── src/                       # the static site itself
│   ├── assets/
│   │   ├── images/            # README + poster placeholder — add your real images
│   │   └── video/             # README — add your real vsl.mp4 here
│   ├── css/
│   │   ├── reset.css
│   │   └── styles.css
│   ├── js/
│   │   ├── cookie-consent.js
│   │   ├── lead-form.js
│   │   ├── main.js             # gates the calendar embed behind consent
│   │   └── video-player.js
│   ├── index.html
│   ├── robots.txt
│   └── sitemap.xml
├── tests/
│   ├── cookie-consent.test.js         # pure storage functions + banner DOM wiring
│   ├── handleLeadSubmission.test.js   # submission orchestrator (mock mode)
│   ├── lead-form.test.js              # client validation + form submission DOM wiring
│   ├── mailerlite.test.js             # MailerLite client, mocked fetch
│   ├── main.test.js                   # calendar consent-gating DOM wiring
│   ├── submit-lead.test.js            # serverless handler entry point
│   ├── validateLead.test.js           # server-side validation
│   ├── video-player.test.js           # custom video player DOM wiring
│   └── zoho.test.js                   # Zoho CRM client, incl. OAuth refresh
├── build.js                   # production build → dist/
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── CONTRIBUTING.md
├── LICENSE
└── package.json
```

## Getting started

Requires **Node.js 18+**.

```bash
git clone https://github.com/MrBoyard7/vsl-booking-landing-page.git
cd vsl-booking-landing-page
npm install
npm start
```

Then open **http://localhost:3000**. The repo ships with a `.env` already
set to `MOCK_INTEGRATIONS=true`, so the form works end-to-end out of the
box — MailerLite/Zoho calls are simulated (logged, not sent) until you add
real credentials (see [Configuring the integrations](#configuring-the-integrations)).

## Testing

```bash
npm run lint          # ESLint
npm run format:check  # Prettier, check-only
npm test              # Jest, with coverage (writes ./coverage)
npm run build         # production build → ./dist
```

To manually verify the booking flow:

1. `npm start`
2. Open http://localhost:3000, accept cookies, fill in the form, submit.
3. Check the terminal running the server — you'll see
   `[MailerLite] Skipping…` and `[Zoho CRM] Skipping…` (mock mode), and the
   page will still show the "you're booked in" confirmation.
4. To exercise the real APIs instead, follow
   [docs/SETUP.md](docs/SETUP.md) to add real credentials, set
   `MOCK_INTEGRATIONS=false` in `.env`, and repeat step 2 — the lead should
   then appear in both MailerLite and Zoho CRM within a few seconds.

## Configuring the integrations

Full walkthrough (MailerLite, Zoho CRM OAuth, the Microsoft Bookings
calendar embed, and the cookie consent gating) lives in
**[docs/SETUP.md](docs/SETUP.md)**.

## Deployment

See [docs/SETUP.md § Deployment](docs/SETUP.md#7-deployment-no-extra-subscription-required)
for Vercel/Netlify/GitHub Pages instructions — every option used stays on
a free tier.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for the
local workflow and the checks that must pass before a PR is merged.

## License

[MIT](LICENSE) © 2026 [Prince Boyard MBOUNGOU NGOMA](https://github.com/MrBoyard7)