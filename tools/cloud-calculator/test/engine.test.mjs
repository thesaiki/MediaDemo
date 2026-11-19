// Pins the cost engine to hand-checked figures. Run: node test/engine.test.mjs
// Loads prices.json, engine.js and presets.js the same way the browser does (as plain scripts),
// so it does not depend on the host repo's module settings.
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const src = f => readFileSync(resolve(here, '..', 'src', f), 'utf8');
const ctx = { module: undefined };
vm.createContext(ctx);
const book = `const PRICE_BOOK = ${src('prices.json')};\n`;
vm.runInContext(book + src('engine.js') + '\n' + src('presets.js') + '\n;globalThis.__api = { calc, USE_CASES, PLANS };', ctx);
const { calc, USE_CASES, PLANS } = ctx.__api;
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 0.01, `${msg}: expected ${b}, got ${a}`);
const byId = id => USE_CASES.find(u => u.id === id).s();

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok', name); };

t('library has 10 AI and 7 Media use cases', () => {
  assert.equal(USE_CASES.filter(u => u.group === 'AI').length, 10);
  assert.equal(USE_CASES.filter(u => u.group === 'Media').length, 7);
});

t('support preset matches the hand calculation', () => {
  const r = calc(byId('support'));
  // 2 × RTX 4000 Ada x1 Medium × 730 h × $0.67 = $978.20
  near(r.servingCost, 978.2, 'serving');
  // + G8 8x4 ×2 ($204.40) + LKE HA $60 + NB $10 + Obj $5 + Block $10 + PG G7 4GB 2-node $171.60
  near(r.opex, 1439.2, 'opex');
  near(r.budget, 1655.08, 'budget');       // × 1.15 reserve
  near(r.year1, 34860.96, 'year 1');       // $15,000 one-time + 12 × budget
  near(r.egressCost, 0, 'egress');         // 0.5 TB < 1 TB Object Storage pool
});

t('every preset produces finite, non-negative totals', () => {
  for (const u of USE_CASES) {
    const r = calc(u.s());
    assert.ok(Number.isFinite(r.opex) && r.opex >= 0, u.id);
    assert.ok(Number.isFinite(r.year1) && r.year1 >= r.opex, u.id);
  }
});

t('GPU, VPU and G8 plans add no transfer allowance', () => {
  for (const [k, p] of Object.entries(PLANS)) {
    if (/^(ada|bw|vpu|g8)-/.test(k)) assert.equal(p.tb, 0, k);
  }
});

t('monthly cap applies to plans that publish one', () => {
  const s = byId('m-live');               // VPU x1 Small: $0.42/h but capped at $280/mo
  const r = calc(s);
  const vpu = r.lines.find(l => l.item.includes('NETINT Quadra T1U VPU x1 Small'));
  near(vpu.monthly, 2 * 280, 'two capped VPU instances');
});

t('routing everything external removes GPU serving cost', () => {
  const s = byId('support');
  s.routing.linodeShare = 0;
  const r = calc(s);
  near(r.servingCost, 0, 'serving');
  near(r.apiCost, r.allExternal, 'api');
});

console.log(`\n${n} checks passed`);
