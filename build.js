/**
 * Production build.
 *
 * The site is intentionally dependency-free vanilla JS/CSS/HTML, so there's
 * no bundler needed for correctness — only for minification. This script
 * uses esbuild (fast, zero-config) to minify CSS/JS and copies everything
 * else into `dist/`, ready to deploy as a static site (Netlify, Vercel,
 * GitHub Pages, or any static host).
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const SRC = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');

function clean() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }

  fs.copyFileSync(src, dest);
}

async function build() {
  clean();

  // Copy everything as-is first (HTML, assets, robots.txt, sitemap.xml)...
  copyRecursive(SRC, DIST);

  // ...then overwrite CSS/JS with minified versions.
  await esbuild.build({
    entryPoints: [path.join(SRC, 'css', 'reset.css'), path.join(SRC, 'css', 'styles.css')],
    outdir: path.join(DIST, 'css'),
    minify: true,
    allowOverwrite: true,
  });

  await esbuild.build({
    entryPoints: [
      path.join(SRC, 'js', 'cookie-consent.js'),
      path.join(SRC, 'js', 'video-player.js'),
      path.join(SRC, 'js', 'lead-form.js'),
      path.join(SRC, 'js', 'main.js'),
    ],
    outdir: path.join(DIST, 'js'),
    minify: true,
    allowOverwrite: true,
    target: ['es2018'],
  });

  console.log(`Build complete → ${path.relative(process.cwd(), DIST)}/`);
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});
