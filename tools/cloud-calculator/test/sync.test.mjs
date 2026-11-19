// Price sync checks, offline. Run: node tools/cloud-calculator/test/sync.test.mjs
// Uses trimmed copies of real API responses in test/fixtures/api and a small
// price book in test/fixtures/prices.json; the CLI is exercised on temp copies.
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { computeSync, serializeBook, endpointFile, SyncError } from '../sync/diff.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fx = resolve(here, 'fixtures');
const cli = resolve(here, '..', 'sync', 'sync-prices.mjs');
const readJson = f => JSON.parse(readFileSync(f, 'utf8'));
const mapping = readJson(resolve(here, '..', 'sync', 'mapping.json'));
const book = () => readJson(join(fx, 'prices.json'));
const api = () => Object.fromEntries(mapping.endpoints.map(ep => [ep, readJson(join(fx, 'api', endpointFile(ep)))]));
const DATE = '2026-11-20';
const linode = (a, id) => a['linode/types'].data.find(d => d.id === id);

const tmp = mkdtempSync(join(tmpdir(), 'price-sync-test-'));
function sandbox(mutate) {
  const dir = mkdtempSync(join(tmp, 'case-'));
  mkdirSync(join(dir, 'api'));
  const a = api();
  if (mutate) mutate(a);
  for (const [ep, json] of Object.entries(a)) writeFileSync(join(dir, 'api', endpointFile(ep)), JSON.stringify(json));
  copyFileSync(join(fx, 'prices.json'), join(dir, 'prices.json'));
  return dir;
}
function run(dir, ...extra) {
  const ghOut = join(dir, 'gh-output');
  writeFileSync(ghOut, '');
  const r = spawnSync(process.execPath, [cli, '--fixtures', join(dir, 'api'), '--prices', join(dir, 'prices.json'), '--date', DATE, '--summary', join(dir, 'summary.md'), ...extra],
    { encoding: 'utf8', env: Object.assign({}, process.env, { GITHUB_OUTPUT: ghOut }) });
  return { code: r.status, out: r.stdout + r.stderr, gh: readFileSync(ghOut, 'utf8'), prices: readFileSync(join(dir, 'prices.json'), 'utf8'), summary: () => readFileSync(join(dir, 'summary.md'), 'utf8') };
}
const original = readFileSync(join(fx, 'prices.json'), 'utf8');

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok', name); };

t('fixture book round-trips through the serializer unchanged', () => {
  assert.equal(serializeBook(book()), original);
});

t('no-change run is a no-op: file byte-identical, changed=false', () => {
  const r = run(sandbox());
  assert.equal(r.code, 0, r.out);
  assert.equal(r.prices, original);
  assert.equal(r.gh, 'changed=false\n');
  assert.match(r.summary(), /No changes/);
});

t('a price change is applied, logged and a second run is a no-op', () => {
  const dir = sandbox(a => { linode(a, 'g2-gpu-rtx4000a1-m').price.hourly = 0.7; });
  const r = run(dir);
  assert.equal(r.code, 0, r.out);
  assert.equal(r.gh, 'changed=true\n');
  const b = JSON.parse(r.prices);
  assert.equal(b.plans['ada-1m'].hr, 0.7);
  assert.equal(b.asOf, DATE);
  assert.equal(b.changes.length, 1);
  assert.deepEqual(b.changes[0], {
    date: DATE,
    items: [{ table: 'plans', key: 'ada-1m', label: 'RTX 4000 Ada x1 Medium', field: 'hr', old: 0.67, new: 0.7 }],
    newPlans: [],
    removed: []
  });
  assert.match(r.summary(), /RTX 4000 Ada x1 Medium.*\| hr \| 0\.67 \| 0\.7 \|/);
  const again = run(dir);
  assert.equal(again.code, 0, again.out);
  assert.equal(again.prices, r.prices);
  assert.equal(again.gh, 'changed=false\n');
});

t('database and rate changes are applied', () => {
  const a = api();
  a['databases/types'].data[0].engines.postgresql.find(e => e.quantity === 2).price.monthly = 180;
  a['lke/types'].data.find(d => d.id === 'lke-ha').price.monthly = 72;
  const r = computeSync(book(), mapping, a, { date: DATE });
  assert.equal(r.book.dbPlans['pg-g7-4'].p['2'], 180);
  assert.equal(r.book.rates.lkeHA.value, 72);
  assert.deepEqual(r.items.map(i => `${i.table}.${i.key}.${i.field}`), ['dbPlans.pg-g7-4.p.2', 'rates.lkeHA.value']);
});

t('manual items are never touched', () => {
  const a = api();
  const r = computeSync(book(), mapping, a, { date: DATE });
  assert.equal(r.changed, false);
  assert.deepEqual(r.book.plans['bw-1'], book().plans['bw-1']);
  assert.equal(r.book.rates.managedPerInstance.value, 100);
});

t('a new plan in a covered family is added with API-derived metadata', () => {
  const a = api();
  a['linode/types'].data.push(readJson(join(fx, 'new-plan-g8.json')));
  const r = computeSync(book(), mapping, a, { date: DATE });
  const p = r.book.plans['g8-dedicated-96-48'];
  assert.deepEqual(p, { name: 'G8 Dedicated 96x48', fam: 'CPU', hr: 1.62, tb: 0, spec: '48 vCPU · 96 GB', src: 'cpu', line: 'G8 Dedicated', sync: 'api', apiId: 'g8-dedicated-96-48' });
  // Grouped after the existing G8 plan, not appended at the end.
  assert.deepEqual(Object.keys(r.book.plans), ['ada-1m', 'bw-1', 'g8-8x4', 'g8-dedicated-96-48', 'g7-8']);
  assert.deepEqual(r.entry.newPlans, [{ key: 'g8-dedicated-96-48', name: 'G8 Dedicated 96x48' }]);
  assert.equal(r.book.asOf, DATE);
});

t('uncovered families, ignored ids and deprecated plans are not added', () => {
  const a = api();
  const g8 = readJson(join(fx, 'new-plan-g8.json'));
  a['linode/types'].data.push(Object.assign({}, g8, { id: 'g8-dedicated-old', successor: 'g8-dedicated-96-48' }));
  a['linode/types'].data.push(g8);
  const m = Object.assign({}, mapping, { ignoreIds: ['g8-dedicated-96-48'] });
  const r = computeSync(book(), m, a, { date: DATE }); // g6-dedicated-2 is in the fixture but not a covered family
  assert.equal(r.changed, false);
});

t('a vanished API id is reported and flagged, not deleted', () => {
  const a = api();
  a['lke/types'].data = a['lke/types'].data.filter(d => d.id !== 'lke-ha');
  const r = computeSync(book(), mapping, a, { date: DATE });
  assert.equal(r.book.rates.lkeHA.value, 60);
  assert.equal(r.book.rates.lkeHA.missingSince, DATE);
  assert.deepEqual(r.entry.removed, [{ table: 'rates', key: 'lkeHA', label: 'LKE HA control plane', apiId: 'lke/types:lke-ha' }]);
  // Next day, still missing: no new changelog entry.
  const r2 = computeSync(r.book, mapping, a, { date: '2026-11-21' });
  assert.equal(r2.changed, false);
  assert.equal(r2.stillMissing.length, 1);
});

t('guard: more than 20% of mapped items missing exits 1 without writing', () => {
  const dir = sandbox(a => {
    a['lke/types'].data = a['lke/types'].data.filter(d => d.id !== 'lke-ha');
    a['linode/types'].data = a['linode/types'].data.filter(d => d.id !== 'g7-dedicated-8-4');
  });
  const r = run(dir);
  assert.equal(r.code, 1, r.out);
  assert.equal(r.prices, original);
  assert.equal(r.gh, 'changed=false\n');
  assert.match(r.out, /2 of 5 mapped API items are missing/);
  assert.match(r.summary(), /blocked/);
});

t('guard: a move above ±50% exits 1 without writing; --allow-large accepts it', () => {
  const dir = sandbox(a => { linode(a, 'g7-dedicated-8-4').price.hourly = 0.2; });
  const r = run(dir);
  assert.equal(r.code, 1, r.out);
  assert.equal(r.prices, original);
  assert.match(r.out, /plans\.g7-8\.hr \(G7 Dedicated 8 GB\): 0\.129 -> 0\.2/);
  const ok = run(dir, '--allow-large');
  assert.equal(ok.code, 0, ok.out);
  assert.equal(JSON.parse(ok.prices).plans['g7-8'].hr, 0.2);
});

t('--dry-run reports but does not write', () => {
  const dir = sandbox(a => { linode(a, 'g2-gpu-rtx4000a1-m').price.hourly = 0.7; });
  const r = run(dir, '--dry-run');
  assert.equal(r.code, 0, r.out);
  assert.equal(r.prices, original);
  assert.equal(r.gh, 'changed=false\n');
  assert.match(r.out, /0\.67 \| 0\.7/);
});

t('guard: malformed or failed responses exit 1 without writing', () => {
  assert.throws(() => computeSync(book(), mapping, Object.assign(api(), { 'volumes/types': { errors: [{ reason: 'Not found' }] } }), { date: DATE }), SyncError);
  assert.throws(() => { const a = api(); linode(a, 'g7-dedicated-8-4').price.hourly = 'free'; computeSync(book(), mapping, a, { date: DATE }); }, /not a non-negative number/);
  const dir = sandbox();
  rmSync(join(dir, 'api', endpointFile('volumes/types')));
  const r = run(dir);
  assert.equal(r.code, 1, r.out);
  assert.equal(r.prices, original);
});

t('repo price book is well-formed for the sync', () => {
  const b = readJson(resolve(here, '..', 'src', 'prices.json'));
  assert.match(b.asOf, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(Array.isArray(b.changes));
  for (const [k, p] of Object.entries(b.plans)) {
    assert.ok(['api', 'manual'].includes(p.sync), `plans.${k}.sync`);
    if (p.sync === 'api') assert.ok(p.apiId, `plans.${k}.apiId`);
    assert.ok(p.name && p.fam && p.line && p.src && typeof p.hr === 'number' && typeof p.tb === 'number', `plans.${k} fields`);
  }
  for (const [k, d] of Object.entries(b.dbPlans)) if (d.sync === 'api') assert.ok(d.apiId && d.engine, `dbPlans.${k}`);
  for (const [k, r] of Object.entries(b.rates)) {
    assert.ok(['api', 'manual'].includes(r.sync), `rates.${k}.sync`);
    if (r.sync === 'api') assert.ok(mapping.rates[k], `mapping rule for rates.${k}`);
  }
  assert.equal(serializeBook(b), readFileSync(resolve(here, '..', 'src', 'prices.json'), 'utf8'), 'prices.json is in canonical form');
});

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${n} checks passed`);
