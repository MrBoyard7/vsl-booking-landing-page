# Contributing

Thanks for considering a contribution. This is a small project, so the
process is deliberately light.

## Getting started

```bash
git clone https://github.com/MrBoyard7/vsl-booking-landing-page.git
cd vsl-booking-landing-page
npm install
cp .env.example .env
npm start
```

## Before opening a pull request

```bash
npm run lint
npm run format:check
npm test
npm run build
```

All four must pass — this is exactly what CI checks on every PR.

## Code style

- Formatting is enforced by Prettier (`npm run format` to auto-fix).
- Linting is enforced by ESLint (`npm run lint`).
- No build framework/bundler dependency for the front end — keep it
  vanilla HTML/CSS/JS unless there's a strong reason to introduce one.

## Commit messages

Plain, descriptive, imperative mood is fine — e.g. `Fix mobile video
autoplay fallback`, not `fixed bug`.

## Reporting bugs / suggesting features

Open a GitHub issue with steps to reproduce (for bugs) or the problem
you're trying to solve (for feature requests).
