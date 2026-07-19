# Images — place your real assets here

- `og-cover.jpg` — referenced in `src/index.html`'s Open Graph tags for link
  previews (LinkedIn, Slack, X/Twitter, etc). Recommended size: 1200×630px,
  under 300KB.
- `vsl-poster.svg` — placeholder poster frame for the video player. Swap for
  a real `.jpg`/`.webp` still from your VSL once you have one, and update
  the `poster` attribute on the `<video>` element in `src/index.html`.

Keep any photographs optimized (WebP where possible, `loading="lazy"` for
anything below the fold) to stay inside the sub-3-second load budget.
