// Builds the Cloud Calculator into one self-contained HTML document.
// Usage: node build.mjs [output-path]   (default: dist/cloud-calculator.html)
// MAIN_SITE_URL overrides the "Back to Media Solutions" link target.
// No dependencies. Works whether or not the host repo uses "type": "module".
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = f => readFileSync(resolve(here, 'src', f), 'utf8');
const out = resolve(process.argv[2] || resolve(here, 'dist', 'cloud-calculator.html'));

let body = read('src.html')
  .replace('/*ENGINE*/', () => read('engine.js'))
  .replace('/*PRESETS*/', () => read('presets.js'))
  // Artifact-only hint; meaningless on the public site.
  .replace(/<meta name="claude:viewport-fit-sides"[^>]*>\s*/, '');

const mainSite = process.env.MAIN_SITE_URL;
if (mainSite) {
  if (!/^https?:\/\//.test(mainSite)) throw new Error('MAIN_SITE_URL must start with http:// or https://');
  const safe = mainSite.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  body = body.replace(/href="[^"]*"(\s+data-main-site)/, () => `href="${safe}"$1`);
}

// src.html was authored as a page fragment. Everything before the masthead
// (title, font links, styles) belongs in <head>.
const cut = body.indexOf('<header class="mast">');
if (cut < 0) throw new Error('src.html: masthead not found');
const headPart = body.slice(0, cut);
const bodyPart = body.slice(cut);

const reset = `<style>
:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0}
img{max-width:100%}
[hidden]{display:none!important}
</style>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Plan monthly and first-year cost for AI and Media AI workloads on Akamai Cloud (Linode).">
<link rel="icon" href="data:,">
${reset}
${headPart.trim()}
</head>
<body>
${bodyPart.trim()}
</body>
</html>
`;

// Fail the build if either inline script does not parse.
for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Function(m[1]);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`wrote ${out} (${html.length.toLocaleString('en-US')} bytes)`);
