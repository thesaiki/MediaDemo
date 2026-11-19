// Pure diff/apply logic for the Cloud Calculator price sync. No I/O here, so
// it can be unit tested with fixtures. sync-prices.mjs does the fetching and writing.

export class SyncError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'SyncError';
    this.details = details;
  }
}

export const MAX_MISSING_RATIO = 0.2;
export const MAX_MOVE_RATIO = 0.5;
const PRICE_FIELDS_EXEMPT = new Set(['tb', 'objPoolTB']); // allowances, not prices

/** File name a saved response for an endpoint uses, e.g. linode/types -> linode_types.json */
export const endpointFile = endpoint => endpoint.replace(/\//g, '_') + '.json';

const TRANSFORMS = {
  identity: x => x,
  gb_to_tb: x => Math.round((x / 1000) * 1e6) / 1e6
};

const isNum = v => typeof v === 'number' && Number.isFinite(v);
const clone = o => JSON.parse(JSON.stringify(o));
const same = (a, b) => (a ?? null) === (b ?? null);

export function serializeBook(book) {
  return JSON.stringify(book, null, 2) + '\n';
}

/** Throws SyncError unless a response looks like a Linode list response. */
export function validateResponse(endpoint, json) {
  const bad = why => { throw new SyncError(`Malformed response from ${endpoint}: ${why}`); };
  if (!json || typeof json !== 'object' || Array.isArray(json)) bad('not a JSON object');
  if (!Array.isArray(json.data)) bad('missing data array');
  if (json.data.length === 0) bad('empty data array');
  for (const [i, item] of json.data.entries()) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id) bad(`item ${i} has no string id`);
  }
  if (json.pages !== undefined && !(Number.isInteger(json.pages) && json.pages >= 1)) bad('pages is not a positive integer');
  return json;
}

/** { endpoint: { data: [...] } } -> { endpoint: Map(id -> item) } */
export function indexApi(api) {
  const idx = {};
  for (const [endpoint, json] of Object.entries(api)) {
    validateResponse(endpoint, json);
    idx[endpoint] = new Map(json.data.map(item => [item.id, item]));
  }
  return idx;
}

const getPath = (obj, path) => path.split('.').reduce((a, k) => (a == null ? undefined : a[k]), obj);

function readField(item, rule, where) {
  const raw = getPath(item, rule.field);
  if (raw === null || raw === undefined) {
    if (rule.required === false) return null;
    throw new SyncError(`Malformed data: ${where} has no ${rule.field}`);
  }
  if (!isNum(raw) || raw < 0) throw new SyncError(`Malformed data: ${where} ${rule.field} is not a non-negative number (${JSON.stringify(raw)})`);
  const t = TRANSFORMS[rule.transform || 'identity'];
  if (!t) throw new SyncError(`Unknown transform ${rule.transform} in mapping`);
  return t(raw);
}

function dbPrices(item, engine, where) {
  const arr = item.engines && item.engines[engine];
  if (!Array.isArray(arr)) return undefined;
  const out = {};
  for (const e of arr) {
    const price = e && e.price && e.price.monthly;
    if (!Number.isInteger(e && e.quantity) || !isNum(price) || price < 0) {
      throw new SyncError(`Malformed data: ${where} ${engine} entry ${JSON.stringify(e)}`);
    }
    out[String(e.quantity)] = price;
  }
  return out;
}

function fillTemplate(tpl, item) {
  const memGB = Math.round(item.memory / 1024);
  const tb = TRANSFORMS.gb_to_tb(item.transfer || 0);
  const vals = {
    label: item.label,
    memGB,
    vcpus: item.vcpus,
    gpus: item.gpus,
    vpus: item.accelerated_devices,
    xfer: tb > 0 ? ` · ${tb} TB transfer` : '',
    ratioTag: item.vcpus && memGB / item.vcpus === 4 ? ' (1:4)' : ''
  };
  return tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vals ? String(vals[k]) : m));
}

/** Builds a calculator plan entry from a linode/types item. */
export function planFromApi(item, family, mapping) {
  for (const k of ['label', 'memory', 'vcpus']) {
    if (item[k] === undefined || item[k] === null) throw new SyncError(`Malformed data: new plan ${item.id} has no ${k}`);
  }
  let label = item.label;
  for (const [from, to] of family.labelReplace || []) label = label.replace(new RegExp(from, 'g'), to);
  const named = Object.assign({}, item, { label });
  const plan = { name: fillTemplate(family.name, named), fam: family.fam };
  plan.hr = readField(item, mapping.planFields.hr, item.id);
  const mo = readField(item, mapping.planFields.mo, item.id);
  if (mo !== null) plan.mo = mo;
  plan.tb = readField(item, mapping.planFields.tb, item.id);
  plan.spec = fillTemplate(family.spec, item);
  plan.src = family.src;
  plan.line = family.line;
  plan.sync = 'api';
  plan.apiId = item.id;
  return plan;
}

/**
 * Compares a price book with API data and returns the updated book plus a delta.
 * Never mutates its inputs. Throws SyncError on malformed data or when a guard trips.
 *
 * @param {object} book      contents of prices.json
 * @param {object} mapping   contents of sync/mapping.json
 * @param {object} api       { endpoint: raw list response }
 * @param {{date: string, allowLarge?: boolean}} opts
 */
export function computeSync(book, mapping, api, opts) {
  const date = opts.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new SyncError(`Bad date ${date}`);
  for (const ep of mapping.endpoints) if (!api[ep]) throw new SyncError(`No data for endpoint ${ep}`);
  const idx = indexApi(api);
  const next = clone(book);
  const items = [];
  const removed = [];
  const restored = [];
  const stillMissing = [];
  let mapped = 0;
  let missing = 0;

  const record = (table, key, label, field, oldV, newV) => {
    items.push({ table, key, label, field, old: oldV ?? null, new: newV ?? null });
  };
  const markMissing = (table, key, entry, apiId) => {
    missing++;
    if (entry.missingSince) stillMissing.push({ table, key, apiId, since: entry.missingSince });
    else { entry.missingSince = date; removed.push({ table, key, label: entry.name || entry.label || key, apiId }); }
  };
  const markFound = (table, key, entry) => {
    if (entry.missingSince) { delete entry.missingSince; restored.push({ table, key, label: entry.name || entry.label || key }); }
  };
  const checkSync = (table, key, entry) => {
    if (entry.sync !== 'api' && entry.sync !== 'manual') throw new SyncError(`${table}.${key} must set sync to "api" or "manual"`);
  };

  // ---- plans
  const linodeTypes = idx[mapping.planFields.hr.endpoint];
  const knownIds = new Set();
  for (const [key, plan] of Object.entries(next.plans)) {
    checkSync('plans', key, plan);
    if (plan.sync !== 'api') continue;
    if (!plan.apiId) throw new SyncError(`plans.${key} is sync "api" but has no apiId`);
    knownIds.add(plan.apiId);
    mapped++;
    const item = linodeTypes.get(plan.apiId);
    if (!item) { markMissing('plans', key, plan, plan.apiId); continue; }
    markFound('plans', key, plan);
    for (const [field, rule] of Object.entries(mapping.planFields)) {
      const v = readField(item, rule, plan.apiId);
      if (same(plan[field], v)) continue;
      record('plans', key, plan.name, field, plan[field], v);
      if (v === null) delete plan[field]; else plan[field] = v;
    }
  }

  // ---- managed database plans
  const dbTypes = idx[mapping.dbPlans.endpoint];
  for (const [key, db] of Object.entries(next.dbPlans)) {
    checkSync('dbPlans', key, db);
    if (db.sync !== 'api') continue;
    if (!db.apiId || !db.engine) throw new SyncError(`dbPlans.${key} is sync "api" but lacks apiId or engine`);
    mapped++;
    const item = dbTypes.get(db.apiId);
    const prices = item && dbPrices(item, db.engine, db.apiId);
    const lost = prices ? Object.keys(db.p).filter(n => !(n in prices)) : [];
    if (!prices || lost.length) { markMissing('dbPlans', key, db, `${db.apiId}/${db.engine}${lost.length ? ' nodes ' + lost.join(',') : ''}`); }
    else markFound('dbPlans', key, db);
    if (!prices) continue;
    for (const [n, v] of Object.entries(prices)) {
      if (same(db.p[n], v)) continue;
      record('dbPlans', key, db.name, `p.${n}`, db.p[n], v);
      db.p[n] = v;
    }
    // Keep node counts in ascending order so the JSON stays stable.
    db.p = Object.fromEntries(Object.entries(db.p).sort((a, b) => +a[0] - +b[0]));
  }

  // ---- rates
  for (const [key, rate] of Object.entries(next.rates)) {
    checkSync('rates', key, rate);
    if (rate.sync !== 'api') continue;
    const rule = mapping.rates[key];
    if (!rule) throw new SyncError(`rates.${key} is sync "api" but sync/mapping.json has no rule for it`);
    mapped++;
    const item = idx[rule.endpoint] && idx[rule.endpoint].get(rule.id);
    if (!item) { markMissing('rates', key, rate, `${rule.endpoint}:${rule.id}`); continue; }
    markFound('rates', key, rate);
    const v = readField(item, Object.assign({ required: true }, rule), `${rule.endpoint}:${rule.id}`);
    if (same(rate.value, v)) continue;
    record('rates', key, rate.label, 'value', rate.value, v);
    rate.value = v;
  }

  // ---- guards
  const missingRatio = mapped ? missing / mapped : 0;
  if (missingRatio > MAX_MISSING_RATIO) {
    throw new SyncError(
      `${missing} of ${mapped} mapped API items are missing (${Math.round(missingRatio * 100)}% > ${MAX_MISSING_RATIO * 100}%). Refusing to write.`,
      removed.concat(stillMissing).map(r => `${r.table}.${r.key} (${r.apiId})`)
    );
  }
  const large = items.filter(i => !PRICE_FIELDS_EXEMPT.has(i.field) && !PRICE_FIELDS_EXEMPT.has(i.key) && isNum(i.old) && isNum(i.new) &&
    (i.old === 0 ? i.new !== 0 : Math.abs(i.new - i.old) / i.old > MAX_MOVE_RATIO));
  if (large.length && !opts.allowLarge) {
    throw new SyncError(
      `${large.length} price(s) moved by more than ±${MAX_MOVE_RATIO * 100}%. Re-run with --allow-large if this is real.`,
      large.map(i => `${i.table}.${i.key}.${i.field} (${i.label}): ${i.old} -> ${i.new}`)
    );
  }

  // ---- new plans in covered families
  const ignore = new Set(mapping.ignoreIds || []);
  const families = mapping.families.map(f => Object.assign({}, f, { re: new RegExp(f.match) }));
  const newPlans = [];
  for (const item of linodeTypes.values()) {
    if (knownIds.has(item.id) || ignore.has(item.id) || item.successor) continue;
    const family = families.find(f => f.re.test(item.id));
    if (!family) continue;
    if (next.plans[item.id]) throw new SyncError(`New plan ${item.id} collides with an existing plan key`);
    newPlans.push({ key: item.id, plan: planFromApi(item, family, mapping) });
  }
  if (newPlans.length) next.plans = insertPlans(next.plans, newPlans);

  const changed = items.length > 0 || newPlans.length > 0 || removed.length > 0 || restored.length > 0;
  let entry = null;
  if (changed) {
    entry = {
      date,
      items,
      newPlans: newPlans.map(n => ({ key: n.key, name: n.plan.name })),
      removed: removed.map(r => ({ table: r.table, key: r.key, label: r.label, apiId: r.apiId }))
    };
    if (restored.length) entry.restored = restored;
    next.asOf = date;
    next.changes = [entry].concat(next.changes || []);
  }

  return { changed, book: next, entry, items, newPlans, removed, restored, stillMissing, large, mapped, missing };
}

/** Inserts new plans after the last existing plan of the same product line (or at the end), sorted by hourly price. */
function insertPlans(plans, newPlans) {
  const byLine = new Map();
  for (const n of newPlans.slice().sort((a, b) => a.plan.hr - b.plan.hr)) {
    if (!byLine.has(n.plan.line)) byLine.set(n.plan.line, []);
    byLine.get(n.plan.line).push(n);
  }
  const entries = Object.entries(plans);
  const out = [];
  for (let i = 0; i < entries.length; i++) {
    out.push(entries[i]);
    const line = entries[i][1].line;
    const nextLine = i + 1 < entries.length ? entries[i + 1][1].line : undefined;
    if (line !== nextLine && byLine.has(line) && !entries.slice(i + 1).some(([, p]) => p.line === line)) {
      for (const n of byLine.get(line)) out.push([n.key, n.plan]);
      byLine.delete(line);
    }
  }
  for (const list of byLine.values()) for (const n of list) out.push([n.key, n.plan]);
  return Object.fromEntries(out);
}

const fmt = v => (v === null || v === undefined ? '—' : String(v));

/** Markdown summary of a sync result (or a failure). */
export function formatSummary(result, meta = {}) {
  const lines = [];
  if (result.error) {
    lines.push(`## Cloud price sync blocked${meta.date ? ' (' + meta.date + ')' : ''}`, '', result.error.message, '');
    for (const d of result.error.details || []) lines.push(`- ${d}`);
    lines.push('', 'Nothing was written. Check the data, then run the sync by hand (see README, Cloud Calculator).');
    return lines.join('\n') + '\n';
  }
  const r = result;
  lines.push(`## Cloud price sync${meta.date ? ' ' + meta.date : ''}`, '');
  if (!r.changed) {
    lines.push(`No changes. ${r.mapped} API-mapped items checked.`);
  } else {
    lines.push(`${r.items.length} price change(s), ${r.newPlans.length} new plan(s), ${r.removed.length} missing from the API, ${r.restored.length} back in the API. ${r.mapped} API-mapped items checked.`, '');
    if (r.items.length) {
      lines.push('| Item | Field | Old | New |', '|---|---|---|---|');
      for (const i of r.items) lines.push(`| ${i.label} (\`${i.key}\`) | ${i.field} | ${fmt(i.old)} | ${fmt(i.new)} |`);
      lines.push('');
    }
    if (r.newPlans.length) {
      lines.push('New plans added:', '');
      for (const n of r.newPlans) lines.push(`- \`${n.key}\` ${n.plan.name}: $${n.plan.hr}/h${n.plan.mo ? `, cap $${n.plan.mo}/mo` : ''}, ${n.plan.tb} TB`);
      lines.push('');
    }
    if (r.removed.length) {
      lines.push('No longer in the API (kept, flagged with missingSince):', '');
      for (const x of r.removed) lines.push(`- ${x.table}.${x.key} (${x.apiId})`);
      lines.push('');
    }
    if (r.restored.length) {
      lines.push('Back in the API:', '');
      for (const x of r.restored) lines.push(`- ${x.table}.${x.key}`);
      lines.push('');
    }
  }
  if (r.stillMissing.length) {
    lines.push('', 'Still missing from the API:', '');
    for (const x of r.stillMissing) lines.push(`- ${x.table}.${x.key} (${x.apiId}) since ${x.since}`);
  }
  if (r.large.length) {
    lines.push('', `Moves over ±${MAX_MOVE_RATIO * 100}% accepted with --allow-large:`, '');
    for (const i of r.large) lines.push(`- ${i.label} ${i.field}: ${i.old} -> ${i.new}`);
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
