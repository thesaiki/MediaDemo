// Checks the source notes on use-case values. Run: node test/basis.test.mjs
// Loads the same plain scripts as the browser (see engine.test.mjs).
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const here = dirname(fileURLToPath(import.meta.url));
const src = f => readFileSync(resolve(here, '..', 'src', f), 'utf8');
const ctx = { module: undefined };
vm.createContext(ctx);
vm.runInContext(`const PRICE_BOOK = ${src('prices.json')};\n` + src('engine.js') + '\n' + src('presets.js') +
  '\n;globalThis.__api = { USE_CASES, PLANS, BASIS_KINDS, PRESET_BASIS, basisFor, scenarioPaths };', ctx);
const { USE_CASES, PLANS, BASIS_KINDS, PRESET_BASIS, basisFor, scenarioPaths } = ctx.__api;
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const preset = id => USE_CASES.find(u => u.id === id).s();

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok', name); };

t('every value of every use case has a known kind and a note', () => {
  for (const u of USE_CASES) {
    const s = u.s();
    for (const p of scenarioPaths(s)) {
      const b = basisFor(u.id, p, s);
      assert.ok(b, `${u.id} ${p}: no source note`);
      assert.ok(b.k in BASIS_KINDS && b.k !== 'user', `${u.id} ${p}: kind ${b.k}`);
      assert.ok(b.n && b.n.length > 10, `${u.id} ${p}: empty note`);
    }
  }
});

t('per-use-case notes point at real use cases and values', () => {
  for (const [id, notes] of Object.entries(PRESET_BASIS)) {
    const u = USE_CASES.find(x => x.id === id);
    assert.ok(u, `unknown use case ${id}`);
    const paths = scenarioPaths(u.s());
    for (const [p, v] of Object.entries(notes)) {
      assert.ok(paths.includes(p), `${id}: ${p} is not a value of this use case`);
      if (Array.isArray(v)) assert.ok(v[0] in BASIS_KINDS, `${id} ${p}: kind ${v[0]}`);
    }
  }
});

t('plan fields cite the price and its source', () => {
  for (const u of USE_CASES) {
    const s = u.s();
    for (const p of scenarioPaths(s).filter(x => /^(serving|stages\.\d+)\.plan$/.test(x))) {
      const b = basisFor(u.id, p, s);
      const plan = PLANS[get(s, p)];
      assert.equal(b.k, 'price', `${u.id} ${p}`);
      assert.ok(b.n.includes(`$${plan.hr}/h`), `${u.id} ${p}: price missing from note`);
      assert.ok(b.n.includes(plan.sync === 'manual' ? 'kept by hand' : 'pricing API'), `${u.id} ${p}: wrong price source`);
    }
  }
});

t('throughput is a benchmark only for the Blackwell 8B decode figure', () => {
  const vision = preset('vision');
  assert.equal(basisFor('vision', 'serving.decodeTps', vision).k, 'bench');
  assert.equal(basisFor('vision', 'serving.prefillTps', vision).k, 'assumed');
  const rag = preset('rag');
  assert.equal(basisFor('rag', 'serving.decodeTps', rag).k, 'assumed');
  assert.equal(basisFor('rag', 'serving.prefillTps', rag).k, 'assumed');
});

t('RAG volumes, tokens and embedding throughput are assumptions', () => {
  const rag = preset('rag');
  for (const p of ['workload.users', 'workload.tasksPerDay', 'workload.callsPerTask', 'workload.inTok',
    'workload.outTok', 'workload.peakFactor', 'stages.0.units', 'stages.0.rate'])
    assert.equal(basisFor('rag', p, rag).k, 'assumed', p);
  assert.match(basisFor('rag', 'workload.inTok', rag).n, /retrieved chunks/);
});

t('unknown use case or path returns null', () => {
  assert.equal(basisFor('nope', 'workload.users'), null);
  assert.equal(basisFor('rag', 'workload.nothing'), null);
});

console.log(`${n} checks passed`);
