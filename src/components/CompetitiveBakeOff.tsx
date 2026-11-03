import { useState } from 'react'
import {
  measureAsset, measureAll, cloudinaryFetchUrl, isVideoUrl, measureProxyConfigured,
} from '../lib/assetMeasure'
import type { AssetMeasurement, MeasureMethod } from '../lib/assetMeasure'
import { parseSheetFile, toRows, SAMPLE_CSV } from '../lib/sheetImport'
import type { ParsedSheet, ColumnMapping, SheetRow } from '../lib/sheetImport'
import { download, fmtBytes } from '../lib/report'

type Provider = 'origin' | 'competitor' | 'cloudinary'

const PROVIDER_LABEL: Record<Provider, string> = {
  origin: 'Origin',
  competitor: 'SpeedSize',
  cloudinary: 'Cloudinary',
}

interface ResultRow {
  name: string
  origin?: AssetMeasurement
  competitor?: AssetMeasurement
  cloudinary?: AssetMeasurement
  cloudinaryUrl?: string
}

const METHOD_NOTE: Record<MeasureMethod, string> = {
  fetch: 'Exact — read directly from the response',
  proxy: 'Exact — read via the configured proxy',
  timing: 'Sizes from Resource Timing; codec unavailable',
  element: 'Size and codec unavailable (host sends no CORS or Timing-Allow-Origin)',
  failed: 'Could not be measured',
}

const METHOD_STYLE: Record<MeasureMethod, string> = {
  fetch: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  proxy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  timing: 'bg-amber-50 text-amber-700 border-amber-200',
  element: 'bg-orange-50 text-orange-700 border-orange-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
}

export default function CompetitiveBakeOff() {
  const [parsed, setParsed] = useState<ParsedSheet | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [rows, setRows] = useState<SheetRow[]>([])
  const [results, setResults] = useState<ResultRow[]>([])
  const [cloudName, setCloudName] = useState('demo')
  const [transformation, setTransformation] = useState('f_auto,q_auto')
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(0)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  async function acceptFile(f: File) {
    setError(''); setResults([])
    try {
      const p = await parseSheetFile(f)
      setParsed(p)
      setMapping(p.mapping)
      setRows(toRows(p, p.mapping))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that file.')
    }
  }

  function remap(next: ColumnMapping) {
    setMapping(next)
    if (parsed) setRows(toRows(parsed, next))
  }

  function loadSample() {
    acceptFile(new File([SAMPLE_CSV], 'sample-comparison.csv', { type: 'text/csv' }))
  }

  async function run() {
    if (!rows.length) return
    setRunning(true); setDone(0); setError('')
    const out: ResultRow[] = rows.map(r => ({ name: r.name }))
    setResults([...out])

    try {
      await measureAll(rows, async (row, i) => {
        // Measure the origin first: its content-type decides whether the
        // Cloudinary URL should use image/fetch or video/fetch. Guessing from
        // the file extension alone mis-routes extensionless or signed URLs.
        const [origin, competitor] = await Promise.all([
          row.originUrl ? measureAsset(row.originUrl) : Promise.resolve(undefined),
          row.competitorUrl ? measureAsset(row.competitorUrl) : Promise.resolve(undefined),
        ])

        const video = isVideoUrl(row.originUrl, origin?.contentType)
        const cloudUrl = row.originUrl
          ? cloudinaryFetchUrl(row.originUrl, cloudName, transformation, video)
          : undefined
        const cloudinary = cloudUrl ? await measureAsset(cloudUrl) : undefined

        out[i] = { name: row.name, origin, competitor, cloudinary, cloudinaryUrl: cloudUrl }
        setResults([...out])
        setDone(d => d + 1)
      }, 3)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The comparison failed.')
    } finally {
      setRunning(false)
    }
  }

  const measured = results.filter(r => r.origin?.bytes)

  /**
   * Compares like with like: only assets where BOTH the origin and this
   * provider returned real bytes. Substituting the origin size for a failed
   * provider would silently report parity where there was actually a failure.
   */
  function compare(p: Provider) {
    const usable = results.filter(r => r.origin?.bytes && (p === 'origin' || r[p]?.bytes))
    const total = usable.reduce((s, r) => s + (r[p]?.bytes ?? 0), 0)
    const base = usable.reduce((s, r) => s + (r.origin?.bytes ?? 0), 0)
    const missing = measured.length - usable.length
    return { total, base, count: usable.length, missing, delta: base ? ((total - base) / base) * 100 : 0 }
  }


  function buildMarkdown(): string {
    const L: string[] = []
    L.push('# Delivery Bake-Off: Origin vs SpeedSize vs Cloudinary', '')
    L.push(`Generated: ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`, '')
    L.push(`Cloudinary transformation: \`${transformation}\` on cloud \`${cloudName}\``, '')
    if (measured.length) {
      L.push('## Summary', '')
      L.push(
        'Each provider is compared only against the assets it actually returned bytes for, so the ' +
        'percentages are like-for-like. Assets a provider could not deliver are excluded rather than ' +
        'counted at origin size.', '',
      )
      L.push('| Provider | Assets compared | Total bytes | vs same assets at origin |', '| --- | --- | --- | --- |')
      for (const p of ['origin', 'competitor', 'cloudinary'] as Provider[]) {
        const c = compare(p)
        if (!c.count) continue
        L.push(`| ${PROVIDER_LABEL[p]} | ${c.count} of ${measured.length} | ${fmtBytes(c.total)} | ${p === 'origin' ? '—' : `${c.delta.toFixed(1)}%`} |`)
      }
      L.push('')
    }
    L.push('## Per-asset detail', '')
    L.push('| Asset | Provider | Bytes | TTFB (ms) | Container | Codec | vs Origin | Measurement |')
    L.push('| --- | --- | --- | --- | --- | --- | --- | --- |')
    for (const r of results) {
      for (const p of ['origin', 'competitor', 'cloudinary'] as Provider[]) {
        const m = r[p]
        if (!m) continue
        const base = r.origin?.bytes
        const delta = base && m.bytes ? `${(((m.bytes - base) / base) * 100).toFixed(1)}%` : '—'
        L.push(`| ${r.name} | ${PROVIDER_LABEL[p]} | ${m.bytes ? fmtBytes(m.bytes) : '—'} | ${m.ttfbMs ?? '—'} | ${m.container ?? '—'} | ${m.codec ?? '—'} | ${p === 'origin' ? '—' : delta} | ${m.method} |`)
      }
    }
    L.push('')
    L.push('## How these numbers were obtained', '')
    L.push(
      'Browsers deliberately block reading cross-origin response sizes, so the detail available ' +
      'depends on the headers each host sends:', '',
      '- `fetch` / `proxy` — exact bytes, headers and magic-byte codec detection.',
      '- `timing` — host sends Timing-Allow-Origin but not CORS: sizes and TTFB only, no codec.',
      '- `element` — host sends neither: load time only; size and codec cannot be read from a browser.',
      '',
      'Cloudinary fetch URLs report exactly when the cloud is authorised to pull that origin; an ' +
      'unauthorised pull returns HTTP 401 and is excluded from the totals rather than counted. ' +
      'If origin or competitor rows show `element`, point VITE_MEASURE_PROXY at a proxy to recover ' +
      'full fidelity for those hosts.',
    )
    return L.join('\n')
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-gray-800">Competitive bake-off — Origin vs SpeedSize vs Cloudinary</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-3xl">
          Upload a spreadsheet of pristine origin URLs alongside a competitor's optimised URLs. Each
          asset is fetched and measured for bytes delivered, TTFB, container and codec — including
          whether the file was transcoded into a different container, such as JPEG to AVIF or MP4 to
          WebM. The Cloudinary column is generated on the fly from your origin URL via Cloudinary's
          fetch delivery, so no pre-processing is needed.
        </p>
      </div>

      {/* Upload */}
      <div className="flex flex-col sm:flex-row gap-3">
        <label
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) acceptFile(f) }}
          className={`flex-1 block border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
            dragging ? 'border-[#3448C5] bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input type="file" accept=".xlsx,.xls,.csv,.tsv" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f) }} />
          <p className="text-sm font-medium text-gray-700">
            {parsed ? `${rows.length} assets loaded` : 'Drop an .xlsx or .csv here, or click to choose'}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            Needs a column of origin URLs and a column of competitor URLs. Headers are detected automatically.
          </p>
        </label>
        <button onClick={loadSample}
          className="sm:w-44 px-4 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">
          Load sample sheet
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">{error}</div>}

      {!measureProxyConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800">
          <strong>Measurement limits:</strong> browsers block reading cross-origin response sizes. Hosts
          that send <code>Access-Control-Allow-Origin</code> report exact bytes and codec; hosts that send only
          <code> Timing-Allow-Origin</code> report sizes but no codec; hosts that send neither can only be timed.
          Each cell below is labelled with the method used. Set <code>VITE_MEASURE_PROXY</code> to measure
          any host exactly.
        </div>
      )}

      {/* Column mapping + Cloudinary config */}
      {parsed && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {([['name', 'Name column'], ['origin', 'Origin URL column'], ['competitor', 'Competitor URL column']] as const).map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-[11px] font-semibold text-gray-700 block mb-1">{label}</span>
              <select
                value={mapping[key] ?? ''}
                onChange={e => remap({ ...mapping, [key]: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#3448C5]/30"
              >
                <option value="">— none —</option>
                {parsed.headers.map((h, hi) => <option key={`${hi}-${h}`} value={h}>{h}</option>)}
              </select>
            </label>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[11px] font-semibold text-gray-700 block mb-1">Cloud</span>
              <input value={cloudName} onChange={e => setCloudName(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs" />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold text-gray-700 block mb-1">Transform</span>
              <input value={transformation} onChange={e => setTransformation(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs" />
            </label>
          </div>
        </div>
      )}

      {mapping.origin && mapping.origin === mapping.competitor && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
          Origin and competitor are set to the same column, so every asset would be compared against
          itself and report a 0% difference. Pick a different column for one of them.
        </div>
      )}

      {rows.length > 0 && (
        <button onClick={run} disabled={running || mapping.origin === mapping.competitor}
          className="w-full bg-[#3448C5] text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-[#2a3a9e] disabled:opacity-50">
          {running ? `Measuring… ${done}/${rows.length}` : `Run comparison (${rows.length} assets × 3 providers)`}
        </button>
      )}

      {/* Summary */}
      {measured.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-3">
          {(['origin', 'competitor', 'cloudinary'] as Provider[]).map(p => {
            const c = compare(p)
            if (!c.count) return null
            return (
              <div key={p} className={`rounded-lg p-4 text-center border ${p === 'cloudinary' ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="text-lg font-bold text-gray-800">{fmtBytes(c.total)}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {PROVIDER_LABEL[p]} · {c.count} of {measured.length} assets
                </div>
                {p !== 'origin' && (
                  <div className={`text-xs font-semibold mt-1 ${c.delta < 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {c.delta < 0 ? '↓' : '↑'} {Math.abs(c.delta).toFixed(1)}% vs same assets at origin
                  </div>
                )}
                {c.missing > 0 && (
                  <div className="text-[10px] text-amber-700 mt-1">{c.missing} not measurable — excluded</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Detail */}
      {results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-800 text-white">
                <th className="text-left px-3 py-2 font-semibold">Asset</th>
                <th className="text-left px-3 py-2 font-semibold">Provider</th>
                <th className="px-3 py-2 font-semibold">Bytes</th>
                <th className="px-3 py-2 font-semibold">TTFB</th>
                <th className="px-3 py-2 font-semibold">Container</th>
                <th className="px-3 py-2 font-semibold">Codec</th>
                <th className="px-3 py-2 font-semibold">vs Origin</th>
                <th className="px-3 py-2 font-semibold">Measurement</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, ri) => (
                (['origin', 'competitor', 'cloudinary'] as Provider[]).map((p, pi) => {
                  const m = r[p]
                  const base = r.origin?.bytes
                  const delta = base && m?.bytes ? ((m.bytes - base) / base) * 100 : null
                  const converted = r.origin?.container && m?.container && r.origin.container !== m.container
                  return (
                    <tr key={`${ri}-${p}`} className={`border-b border-gray-100 ${p === 'cloudinary' ? 'bg-blue-50/40' : ''}`}>
                      {pi === 0 && <td className="px-3 py-2 font-medium text-gray-800 align-top" rowSpan={3}>{r.name}</td>}
                      <td className="px-3 py-2 text-gray-700">{PROVIDER_LABEL[p]}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{m?.bytes ? fmtBytes(m.bytes) : m ? '—' : running ? '…' : '—'}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{m?.ttfbMs != null ? `${Math.round(m.ttfbMs)} ms` : '—'}</td>
                      <td className="px-3 py-2 text-center">
                        {m?.container
                          ? <span className={converted ? 'font-semibold text-[#3448C5]' : 'text-gray-600'}>
                              {m.container}{converted && ' ✦'}
                            </span>
                          : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600">{m?.codec ?? '—'}</td>
                      <td className="px-3 py-2 text-center">
                        {p === 'origin' ? <span className="text-gray-400">—</span>
                          : delta != null
                            ? <span className={`font-semibold ${delta < 0 ? 'text-emerald-700' : 'text-red-700'}`}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</span>
                            : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {m
                          ? <span title={m.error || METHOD_NOTE[m.method]} className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${METHOD_STYLE[m.method]}`}>
                              {m.method === 'failed' && m.status ? `HTTP ${m.status}` : m.method}
                            </span>
                          : <span className="text-gray-400">{running ? '…' : '—'}</span>}
                      </td>
                    </tr>
                  )
                })
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-gray-400 mt-2">✦ marks a container change versus the origin asset.</p>
        </div>
      )}

      {/* Export */}
      {results.length > 0 && !running && (
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4">
          <button onClick={() => download(`delivery-bakeoff-${Date.now()}.md`, buildMarkdown(), 'text/markdown')}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-gray-800 text-white hover:bg-gray-900">
            Download Markdown
          </button>
          <button onClick={() => download(`delivery-bakeoff-${Date.now()}.json`, JSON.stringify({ cloudName, transformation, results }, null, 2), 'application/json')}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">
            Download JSON
          </button>
          <button onClick={() => navigator.clipboard?.writeText(buildMarkdown())}
            className="px-3 py-1.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">
            Copy report
          </button>
        </div>
      )}
    </div>
  )
}
