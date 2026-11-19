#!/usr/bin/env node
// Refreshes tools/cloud-calculator/src/prices.json from the public Akamai Cloud
// (Linode) pricing API. Unauthenticated GETs only; base prices, not region overrides.
//
// Usage: node tools/cloud-calculator/sync/sync-prices.mjs [options]
//   --dry-run           print the delta, write nothing
//   --summary <file>    write a Markdown summary (also on failure)
//   --allow-large       accept price moves above ±50%
//   --fixtures <dir>    read saved responses (<endpoint with / as _>.json) instead of fetching
//   --prices <file>     price book to update (default: ../src/prices.json)
//   --mapping <file>    mapping (default: ./mapping.json)
//   --date YYYY-MM-DD   date to record (default: today, UTC)
//
// Exit codes: 0 success (changed or not), 1 fetch/validation/guard failure, 2 bad usage.
// When GITHUB_OUTPUT is set, appends changed=true|false.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeSync, formatSummary, serializeBook, endpointFile, validateResponse, SyncError } from './diff.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const USER_AGENT = 'cloud-calculator-price-sync';
const TIMEOUT_MS = 20000;
const MAX_PAGES = 20;

function parseArgs(argv) {
  const o = { dryRun: false, allowLarge: false, summary: null, fixtures: null,
    prices: resolve(here, '..', 'src', 'prices.json'), mapping: resolve(here, 'mapping.json'),
    date: new Date().toISOString().slice(0, 10) };
  const takes = { '--summary': 'summary', '--fixtures': 'fixtures', '--prices': 'prices', '--mapping': 'mapping', '--date': 'date' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') o.dryRun = true;
    else if (a === '--allow-large') o.allowLarge = true;
    else if (takes[a]) {
      const v = argv[++i];
      if (!v || v.startsWith('--')) throw new UsageError(`${a} needs a value`);
      o[takes[a]] = ['summary', 'fixtures', 'prices', 'mapping'].includes(takes[a]) ? resolve(v) : v;
    } else if (a === '-h' || a === '--help') { o.help = true; }
    else throw new UsageError(`Unknown option ${a}`);
  }
  return o;
}
class UsageError extends Error {}

async function fetchJson(url) {
  let res;
  try {
    res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    throw new SyncError(`GET ${url} failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok) throw new SyncError(`GET ${url} returned HTTP ${res.status}`);
  try {
    return await res.json();
  } catch (err) {
    throw new SyncError(`GET ${url} did not return JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function fetchEndpoint(mapping, endpoint) {
  const url = page => `${mapping.base}${endpoint}?${mapping.query}${page > 1 ? `&page=${page}` : ''}`;
  const first = validateResponse(endpoint, await fetchJson(url(1)));
  const data = first.data.slice();
  const pages = first.pages || 1;
  if (pages > MAX_PAGES) throw new SyncError(`${endpoint} reports ${pages} pages; refusing to page past ${MAX_PAGES}`);
  for (let p = 2; p <= pages; p++) data.push(...validateResponse(endpoint, await fetchJson(url(p))).data);
  return { data, page: 1, pages: 1, results: data.length };
}

function readFixture(dir, endpoint) {
  const f = join(dir, endpointFile(endpoint));
  let text;
  try { text = readFileSync(f, 'utf8'); } catch (err) {
    throw new SyncError(`Fixture ${f} unreadable: ${err instanceof Error ? err.message : String(err)}`);
  }
  try { return JSON.parse(text); } catch (err) {
    throw new SyncError(`Fixture ${f} is not JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function loadApi(mapping, fixtures) {
  const api = {};
  for (const ep of mapping.endpoints) api[ep] = fixtures ? readFixture(fixtures, ep) : await fetchEndpoint(mapping, ep);
  return api;
}

function githubOutput(changed) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
}

async function main() {
  let opts;
  try { opts = parseArgs(process.argv.slice(2)); } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    return 2;
  }
  if (opts.help) { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 15).map(l => l.replace(/^\/\/ ?/, '')).join('\n')); return 0; }

  const bookText = readFileSync(opts.prices, 'utf8');
  const book = JSON.parse(bookText);
  const mapping = JSON.parse(readFileSync(opts.mapping, 'utf8'));

  let result;
  try {
    const api = await loadApi(mapping, opts.fixtures);
    result = computeSync(book, mapping, api, { date: opts.date, allowLarge: opts.allowLarge });
  } catch (err) {
    if (!(err instanceof SyncError)) throw err;
    console.error(`price sync failed: ${err.message}`);
    for (const d of err.details) console.error(`  ${d}`);
    if (opts.summary) writeFileSync(opts.summary, formatSummary({ error: err }, { date: opts.date }));
    githubOutput(false);
    return 1;
  }

  const summary = formatSummary(result, { date: opts.date });
  console.log(summary.trimEnd());
  if (opts.summary) writeFileSync(opts.summary, summary);

  if (result.changed && !opts.dryRun) {
    const out = serializeBook(result.book);
    if (out !== bookText) writeFileSync(opts.prices, out);
    console.log(`\nwrote ${opts.prices}`);
  } else if (result.changed) {
    console.log('\n--dry-run: nothing written');
  }
  githubOutput(result.changed && !opts.dryRun);
  return 0;
}

main().then(code => { process.exitCode = code; }, err => {
  console.error(err instanceof Error ? err.stack : String(err));
  process.exitCode = 1;
});
