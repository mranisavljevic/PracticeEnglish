// Prints the anonymous usage report.
// ANALYTICS_REPORT_TOKEN=… npm run report -- --from 2026-10-01 --to 2026-10-29 [--url https://practiceenglish.net]

export {}

const args = process.argv.slice(2)
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? undefined : args[i + 1]
}

const today = new Date().toISOString().slice(0, 10)
const monthAgo = new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10)
const from = flag('from') ?? monthAgo
const to = flag('to') ?? today
const base = (flag('url') ?? 'https://practiceenglish.net').replace(/\/$/, '')
const token = process.env.ANALYTICS_REPORT_TOKEN

if (!token) {
  console.error('Set ANALYTICS_REPORT_TOKEN to the token configured on the site.')
  process.exit(1)
}

interface Report {
  visits: { total: number; byLang: Record<string, number>; byDevice: Record<string, number>; byLangDevice: Record<string, number> }
  trackStarts: {
    total: number
    bySource: Record<string, number>
    byTrack: { level: string; bookType: string; unit: string; track: string; count: number }[]
  }
  resumeUsed: number
  languageChanges: { total: number; byLang: Record<string, number> }
  errors: { total: number; byType: Record<string, number> }
}

const res = await fetch(`${base}/api/report?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${token}` } })
if (res.status === 401) {
  console.error('Unauthorized: ANALYTICS_REPORT_TOKEN does not match the site.')
  process.exit(1)
}
if (res.status === 400) {
  console.error('Bad range: use --from/--to as YYYY-MM-DD, to ≥ from, at most 366 days.')
  process.exit(1)
}
if (!res.ok) {
  console.error(`Report failed: HTTP ${res.status}`)
  process.exit(1)
}
const report = (await res.json()) as Report

const rows = (counts: Record<string, number>, label: string) =>
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ [label]: key, count }))

console.log(`\nUsage ${from} → ${to}\n`)
console.log(`Visits: ${report.visits.total}`)
console.table(rows(report.visits.byLangDevice, 'language/device'))
console.log(`Track starts: ${report.trackStarts.total}`)
console.table(rows(report.trackStarts.bySource, 'source'))
console.log(`"Continue" card uses: ${report.resumeUsed}`)
console.log(`Language changes: ${report.languageChanges.total}`)
console.table(rows(report.languageChanges.byLang, 'to'))
console.log(`Errors: ${report.errors.total}`)
console.table(rows(report.errors.byType, 'type'))
console.log('Top tracks')
console.table(report.trackStarts.byTrack.slice(0, 15))
