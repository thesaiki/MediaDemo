// ---------- Linode AI & Media cost engine (pure functions, no DOM) ----------
const PRICES_ASOF = PRICE_BOOK.asOf; // ISO date of the last price change
const H = 730; // planning-month hours convention

const SRC = {
  gpu: { t: 'Akamai GPU pricing', u: 'https://www.akamai.com/cloud/pricing/gpu' },
  cpu: { t: 'Akamai CPU pricing', u: 'https://www.akamai.com/cloud/pricing/cpu' },
  vpu: { t: 'Akamai Accelerated Compute (VPU) pricing', u: 'https://www.akamai.com/cloud/pricing/accelerated-compute' },
  lke: { t: 'Akamai LKE pricing', u: 'https://www.akamai.com/cloud/pricing/kubernetes' },
  obj: { t: 'Akamai Object Storage pricing', u: 'https://www.akamai.com/cloud/pricing/object-storage' },
  block: { t: 'Akamai Block Storage', u: 'https://www.akamai.com/products/block-storage' },
  nb: { t: 'Akamai NodeBalancers pricing', u: 'https://www.akamai.com/cloud/pricing/nodebalancers' },
  db: { t: 'Akamai Managed Databases pricing', u: 'https://www.akamai.com/cloud/pricing/databases' },
  xfer: { t: 'Network transfer usage and costs (TechDocs)', u: 'https://techdocs.akamai.com/cloud-computing/docs/network-transfer-usage-and-costs' },
  svc: { t: 'Akamai Cloud pricing overview', u: 'https://www.akamai.com/cloud/pricing' },
  bench: { t: 'Akamai blog: RTX PRO 6000 Blackwell benchmarks', u: 'https://www.akamai.com/blog/cloud/benchmarking-nvidia-rtx-pro-6000-blackwell-akamai-cloud' },
  vpuSpec: { t: 'Akamai Accelerated Compute product page', u: 'https://www.akamai.com/products/accelerated-compute' },
  gpuMedia: { t: 'Akamai GPU product page', u: 'https://linode.com/gpus' },
  gpuDocs: { t: 'GPU Linodes (TechDocs)', u: 'https://techdocs.akamai.com/cloud-computing/docs/gpu-compute-instances' },
  user: { t: 'Your assumption', u: '' }
};

// Price data lives in prices.json and is injected ahead of this file as PRICE_BOOK
// (build.mjs and the tests do this). sync/sync-prices.mjs refreshes it from the public API.
// hr = $/hour, mo = monthly cap where the official page lists one, tb = bundled transfer (TB/month)
const PLANS = PRICE_BOOK.plans;
const DBPLANS = PRICE_BOOK.dbPlans;
const RATES = Object.fromEntries(Object.entries(PRICE_BOOK.rates).map(([k, r]) => [k, r.value]));

// Serving profiles: throughput is AGGREGATE per instance under continuous batching.
const PROFILES = {
  'ada-8b': { label: '8B model on RTX 4000 Ada x1 (assumed — benchmark it)', plan: 'ada-1m', prefillTps: 4000, decodeTps: 600, src: 'user' },
  'bw-8b': { label: '8B-class on RTX PRO 6000 Blackwell x1 (~3,030 TPS in Akamai test)', plan: 'bw-1', prefillTps: 20000, decodeTps: 3000, src: 'bench' },
  'bw-30b': { label: '30B-class on Blackwell x1 (assumed)', plan: 'bw-1', prefillTps: 10000, decodeTps: 1500, src: 'user' },
  'bw-70b': { label: '70B-class on Blackwell x2 (assumed)', plan: 'bw-2', prefillTps: 8000, decodeTps: 900, src: 'user' },
  custom: { label: 'Custom (keep my numbers)' }
};

function instCost(plan, hours) {
  const raw = plan.hr * hours;
  return plan.mo ? Math.min(raw, plan.mo) : raw;
}
const ceil = x => Math.ceil(x - 1e-9);
const num = v => (typeof v === 'number' && isFinite(v) ? v : 0);

function calc(s) {
  const lines = [];
  const warn = [];
  let poolTB = 0;
  const add = (layer, item, qty, unit, rate, monthly, src, note, kind) =>
    lines.push({ layer, item, qty, unit, rate, monthly, src, note: note || '', kind: kind || 'recurring' });

  // ---- 1. Demand → calls → tokens
  const w = s.workload;
  const tasks = num(w.users) * num(w.tasksPerDay) * num(w.activeDays);
  const calls = tasks * num(w.callsPerTask) * (1 + num(w.retryPct) / 100);
  const share = Math.min(100, Math.max(0, num(s.routing.linodeShare))) / 100;
  const lCalls = calls * share;
  const aCalls = calls - lCalls;
  const inM = (calls * num(w.inTok)) / 1e6;
  const outM = (calls * num(w.outTok)) / 1e6;

  // ---- 2. Linode model serving
  const sv = s.serving;
  const sp = PLANS[sv.plan];
  const gpuSec = num(w.inTok) / Math.max(1, num(sv.prefillTps)) + num(w.outTok) / Math.max(1, num(sv.decodeTps));
  const busyHrs = (lCalls * gpuSec) / 3600;
  const util = Math.min(0.99, Math.max(0.05, num(sv.utilization)));
  const activeSec = num(w.activeDays) * num(w.activeHours) * 3600;
  const peakCps = activeSec > 0 ? (lCalls / activeSec) * Math.max(1, num(w.peakFactor)) : 0;
  const peakInst = lCalls > 0 ? ceil((peakCps * gpuSec) / util) : 0;
  let inst = 0, instHours = 0, servingCost = 0;
  if (lCalls > 0) {
    if (sv.provisioning === 'always') {
      inst = Math.max(num(sv.minReplicas), peakInst, 1);
      instHours = inst * num(sv.hours);
      servingCost = inst * instCost(sp, num(sv.hours));
      add('Model serving', `${sp.name} — always-on, sized for peak`, inst, 'instances × ' + num(sv.hours) + ' h', sp.hr, servingCost, sp.src,
        `Peak ${peakCps.toFixed(2)} calls/s × ${gpuSec.toFixed(3)} GPU-s/call ÷ ${Math.round(util * 100)}% target utilization = ${peakInst} instance(s); floor ${num(sv.minReplicas)}`);
    } else {
      instHours = Math.max(busyHrs / util, num(sv.minReplicas) * num(sv.hours));
      inst = instHours / H;
      servingCost = instHours * sp.hr;
      add('Model serving', `${sp.name} — elastic (pay per instance-hour)`, instHours, 'instance-hours', sp.hr, servingCost, sp.src,
        `${busyHrs.toFixed(1)} busy GPU-hours ÷ ${Math.round(util * 100)}% utilization; floor ${num(sv.minReplicas)} replica(s). Hourly billing rounds up per instance, so real autoscaling adds some overhead.`);
    }
    poolTB += sp.tb * (instHours / H);
    if (instHours > 0 && busyHrs / instHours > 0.95) warn.push('Model serving is above 95% busy for the month. Add replicas or a faster profile; queues will grow at peak.');
    if (sv.provisioning === 'always' && instHours > 0 && busyHrs / instHours < 0.1)
      warn.push(`Always-on GPUs are only ${Math.round((busyHrs / instHours) * 100)}% busy. Elastic provisioning, a smaller plan, or routing more traffic here would improve unit cost.`);
  }
  const linodeTokM = (lCalls * (num(w.inTok) + num(w.outTok))) / 1e6;
  const linodePerM = linodeTokM > 0 ? servingCost / linodeTokM : 0;

  // ---- 3. External API share (hybrid)
  const apiPer = (num(w.inTok) * num(s.api.inRate) + num(w.outTok) * num(s.api.outRate)) / 1e6;
  const apiCost = aCalls * apiPer;
  if (aCalls > 0) add('External API', 'External model API (hybrid routing)', aCalls, 'calls', apiPer, apiCost, 'user',
    `${Math.round((1 - share) * 100)}% of calls at $${s.api.inRate}/M input and $${s.api.outRate}/M output tokens`);
  const allExternal = calls * apiPer;

  // ---- 4. Pipeline compute stages
  let mediaCompute = 0;
  (s.stages || []).forEach(st => {
    const p = PLANS[st.plan];
    if (!p) return;
    let cost = 0, qty = 0, unit = '', note = '', ih = 0;
    if (st.method === 'fixed') {
      qty = num(st.count); ih = qty * num(st.hours);
      cost = qty * instCost(p, num(st.hours));
      unit = 'instances × ' + num(st.hours) + ' h';
      note = 'Fixed fleet';
    } else if (st.method === 'live') {
      qty = num(st.concurrent) > 0 ? ceil(num(st.concurrent) / Math.max(0.0001, num(st.perInstance))) : 0;
      ih = qty * num(st.hours);
      cost = qty * instCost(p, num(st.hours));
      unit = 'instances × ' + num(st.hours) + ' h';
      note = `${num(st.concurrent)} concurrent ${st.unitLabel || 'units'} ÷ ${num(st.perInstance)} per instance`;
    } else {
      const u = Math.min(0.99, Math.max(0.05, num(st.util) || 0.8));
      ih = num(st.units) / Math.max(0.0001, num(st.rate)) / u;
      qty = ih; cost = ih * p.hr; unit = 'instance-hours';
      note = `${num(st.units).toLocaleString('en-US')} ${st.unitLabel || 'units'} ÷ ${num(st.rate)} per instance-hour ÷ ${Math.round(u * 100)}% utilization`;
    }
    poolTB += p.tb * (ih / H);
    if (p.fam === 'VPU' || /media|transcod|asr|tts|caption|render|clip|vision|embed/i.test(st.label)) mediaCompute += cost;
    add('Pipeline compute', `${st.label} · ${p.name}`, qty, unit, p.hr, cost, p.src, note);
  });

  // ---- 5. Platform, storage & data
  const pf = s.platform;
  if (pf.lke === 'ha') add('Platform & data', 'LKE high-availability control plane', 1, 'cluster', RATES.lkeHA, RATES.lkeHA, 'lke', 'Standard LKE control plane is free; HA starts at $60/cluster/month and varies by region');
  if (pf.lke === 'enterprise') add('Platform & data', 'LKE Enterprise control plane', 1, 'cluster', RATES.lkeEnt, RATES.lkeEnt, 'lke', 'Dedicated HA control plane');
  if (num(pf.nbBasic) > 0) add('Platform & data', 'NodeBalancer', num(pf.nbBasic), 'balancers', RATES.nbBasicMo, num(pf.nbBasic) * RATES.nbBasicMo, 'nb', 'No data-processing charge on basic NodeBalancers');
  if (num(pf.nbPremium) > 0) {
    const c = num(pf.nbPremium) * RATES.nbPremiumHr * H + num(pf.nbPremiumGB) * RATES.nbPremiumPerGB;
    add('Platform & data', 'Premium NodeBalancer', num(pf.nbPremium), 'balancers × 730 h + processed GB', RATES.nbPremiumHr, c, 'nb', `${num(pf.nbPremiumGB).toLocaleString('en-US')} GB outbound processed at $0.005/GB`);
  }
  if (num(pf.objGB) > 0) {
    const c = RATES.objBase + Math.max(0, num(pf.objGB) - RATES.objIncludedGB) * RATES.objPerGB;
    add('Platform & data', 'Object Storage', num(pf.objGB), 'GB stored', RATES.objPerGB, c, 'obj', '$5/month includes 250 GB, then $0.02/GB; adds 1 TB to the transfer pool');
    poolTB += RATES.objPoolTB;
  }
  if (num(pf.blockGB) > 0) add('Platform & data', 'Block Storage volumes', num(pf.blockGB), 'GB provisioned', RATES.blockPerGB, num(pf.blockGB) * RATES.blockPerGB, 'block', 'Billed on allocated size; may vary by data center');
  if (pf.db && pf.db !== 'none') {
    const d = DBPLANS[pf.db];
    let n = num(pf.dbNodes) || 1;
    if (!(n in d.p)) { const ks = Object.keys(d.p).map(Number); n = ks.reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a)); }
    add('Platform & data', `Managed ${d.name}`, n, 'node cluster', d.p[n], d.p[n], 'db', 'Monthly cluster price');
  }
  if (num(pf.mgmt) > 0) add('Services & people', 'Linode Managed (infrastructure management)', num(pf.mgmt), 'instances', RATES.managedPerInstance, num(pf.mgmt) * RATES.managedPerInstance, 'svc', '$100 per compute instance per month');

  // ---- 6. Network
  const egressGB = num(s.network.egressTB) * 1000;
  const billableGB = Math.max(0, egressGB - poolTB * 1000);
  const egressCost = billableGB * RATES.egressPerGB;
  add('Network', 'Metered outbound transfer (overage)', billableGB, 'GB', RATES.egressPerGB, egressCost, 'xfer',
    `${num(s.network.egressTB)} TB outbound minus ${poolTB.toFixed(2)} TB pooled allowance. GPU, Accelerated and G8 plans add no allowance.`);

  // ---- 7. Custom lines
  (s.custom || []).forEach(c => {
    if (!c.label && !num(c.amount)) return;
    add('Services & people', c.label || 'Custom line', 1, c.kind === 'onetime' ? 'one-time' : 'per month', num(c.amount), num(c.amount), 'user', c.kind === 'onetime' ? 'One-time, counted in upfront cash' : '', c.kind);
  });

  // ---- Totals
  const rec = lines.filter(l => l.kind !== 'onetime');
  const opex = rec.reduce((a, l) => a + l.monthly, 0);
  const upfront = lines.filter(l => l.kind === 'onetime').reduce((a, l) => a + l.monthly, 0);
  const reserve = num(s.finance.reservePct) / 100;
  const budget = opex * (1 + reserve);
  const year1 = upfront + 12 * budget;
  const horizon = upfront + num(s.finance.horizon) * budget;
  const byLayer = {};
  rec.forEach(l => (byLayer[l.layer] = (byLayer[l.layer] || 0) + l.monthly));
  const modelCost = servingCost + apiCost;

  return {
    tasks, calls, lCalls, aCalls, inM, outM, gpuSec, busyHrs, peakCps, peakInst, inst, instHours,
    servingCost, apiCost, allExternal, linodePerM, linodeTokM, poolTB, egressGB, billableGB, egressCost,
    opex, upfront, budget, year1, horizon, byLayer, lines, warn, modelCost, mediaCompute,
    perTask: tasks > 0 ? opex / tasks : 0,
    perMediaHour: num(w.mediaHours) > 0 ? opex / num(w.mediaHours) : 0,
    modelShare: opex > 0 ? modelCost / opex : 0
  };
}

if (typeof module !== 'undefined') module.exports = { calc, PLANS, DBPLANS, RATES, PROFILES, SRC, H, PRICES_ASOF, PRICE_BOOK };
