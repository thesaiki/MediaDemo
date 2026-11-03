// Imports a comparison sheet listing pristine origin URLs alongside a
// competitor's optimised URLs. XLSX is parsed with SheetJS loaded on demand
// from its official CDN; CSV is handled natively so the common case needs no
// network dependency at all.

const SHEETJS_CDN = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'

export interface SheetRow {
  name: string
  originUrl: string
  competitorUrl: string
}

export interface ColumnMapping {
  name?: string
  origin?: string
  competitor?: string
}

export interface ParsedSheet {
  headers: string[]
  records: Record<string, string>[]
  mapping: ColumnMapping
}

let sheetJsPromise: Promise<unknown> | null = null

function loadSheetJs(): Promise<unknown> {
  if (sheetJsPromise) return sheetJsPromise
  sheetJsPromise = new Promise((resolve, reject) => {
    const w = window as unknown as Record<string, unknown>
    if (w.XLSX) { resolve(w.XLSX); return }
    const s = document.createElement('script')
    s.src = SHEETJS_CDN
    s.onload = () => resolve((window as unknown as Record<string, unknown>).XLSX)
    s.onerror = () => reject(new Error('Could not load the spreadsheet parser from the SheetJS CDN.'))
    document.head.appendChild(s)
  })
  return sheetJsPromise
}

/** Minimal RFC-4180 CSV parser (handles quotes, embedded commas, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else quoted = false
      } else field += c
    } else if (c === '"') {
      quoted = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some(v => v.trim() !== '')) rows.push(row)
      row = []
    } else field += c
  }
  row.push(field)
  if (row.some(v => v.trim() !== '')) rows.push(row)
  return rows
}

const ORIGIN_PAT = /origin|pristine|source|master|original|baseline|raw|control/i
const COMPETITOR_PAT = /speedsize|speed size|competitor|competition|rival|vendor|optimi[sz]ed|challenger/i
const NAME_PAT = /^(name|asset|id|title|file ?name|label|page|description)$/i

export function detectColumns(headers: string[]): ColumnMapping {
  const m: ColumnMapping = {}
  // A URL column is a strong hint, so prefer headers that mention both.
  m.origin = headers.find(h => ORIGIN_PAT.test(h) && /url|link|src/i.test(h)) ?? headers.find(h => ORIGIN_PAT.test(h))
  m.competitor = headers.find(h => COMPETITOR_PAT.test(h) && /url|link|src/i.test(h)) ?? headers.find(h => COMPETITOR_PAT.test(h))
  m.name = headers.find(h => NAME_PAT.test(h.trim()))

  // A header can satisfy both patterns — "Optimized Source URL" matches
  // `source` and `optimised`. Left unchecked that yields a self-comparison
  // reporting a confident 0% saving, so the competitor claim yields and we
  // look for a different column.
  if (m.origin && m.competitor === m.origin) {
    m.competitor = headers.find(h => h !== m.origin && COMPETITOR_PAT.test(h))
  }

  // Fall back to positional guessing when headers are unhelpful.
  const urlish = headers.filter(h => /url|link|src/i.test(h))
  if (!m.origin && urlish.length) m.origin = urlish[0]
  if (!m.competitor && urlish.length > 1) m.competitor = urlish.find(h => h !== m.origin)
  return m
}

function recordsFromGrid(grid: string[][]): { headers: string[]; records: Record<string, string>[] } {
  if (!grid.length) return { headers: [], records: [] }
  const headers = grid[0].map(h => String(h ?? '').trim())
  const records = grid.slice(1).map(r => {
    const rec: Record<string, string> = {}
    headers.forEach((h, i) => { rec[h] = String(r[i] ?? '').trim() })
    return rec
  })
  return { headers, records }
}

export async function parseSheetFile(file: File): Promise<ParsedSheet> {
  const isCsv = /\.(csv|tsv|txt)$/i.test(file.name) || file.type === 'text/csv'
  let grid: string[][]

  if (isCsv) {
    grid = parseCsv(await file.text())
  } else {
    const XLSX = (await loadSheetJs()) as {
      read: (d: ArrayBuffer, o: Record<string, unknown>) => { SheetNames: string[]; Sheets: Record<string, unknown> }
      utils: { sheet_to_json: (s: unknown, o: Record<string, unknown>) => unknown[][] }
    }
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const first = wb.Sheets[wb.SheetNames[0]]
    grid = (XLSX.utils.sheet_to_json(first, { header: 1, defval: '', raw: false }) as unknown[][])
      .map(r => r.map(c => String(c ?? '')))
  }

  const { headers, records } = recordsFromGrid(grid)
  if (!headers.length) throw new Error('That file has no readable header row.')
  return { headers, records, mapping: detectColumns(headers) }
}

export function toRows(parsed: ParsedSheet, mapping: ColumnMapping): SheetRow[] {
  const { records } = parsed
  return records
    .map((rec, i) => ({
      name: (mapping.name ? rec[mapping.name] : '') || `Asset ${i + 1}`,
      originUrl: mapping.origin ? rec[mapping.origin] : '',
      competitorUrl: mapping.competitor ? rec[mapping.competitor] : '',
    }))
    .filter(r => /^https?:\/\//i.test(r.originUrl) || /^https?:\/\//i.test(r.competitorUrl))
}

/** Sample sheet so the format is obvious without a real file to hand. */
export const SAMPLE_CSV = `Asset,Origin URL,SpeedSize URL
Hero banner,https://res.cloudinary.com/demo/image/upload/sample.jpg,https://res.cloudinary.com/demo/image/upload/q_60/sample.jpg
Product shot,https://res.cloudinary.com/demo/image/upload/woman.jpg,https://res.cloudinary.com/demo/image/upload/q_60/woman.jpg
Lifestyle,https://res.cloudinary.com/demo/image/upload/coffee.jpg,https://res.cloudinary.com/demo/image/upload/q_60/coffee.jpg
`
