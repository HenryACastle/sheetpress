// Static, decorative preview of a published report. Sample data, not a real client.
const chip = { ok: "bg-[var(--okbg)] text-[var(--ok)]", prog: "bg-[var(--progbg)] text-[var(--prog)]", bad: "bg-[var(--badbg)] text-[var(--bad)]", warn: "bg-[var(--warnbg)] text-[var(--warn)]" };
const rows: [string, string, keyof typeof chip, string, number][] = [
  ["Austin", "austin.example.com", "ok", "Done", 100],
  ["Denver", "denver.example.com", "prog", "In progress", 60],
  ["Chicago", "chicago.example.com", "bad", "Blocked", 25],
  ["Boston", "boston.example.com", "warn", "Not started", 0],
  ["Seattle", "seattle.example.com", "ok", "Done", 100],
];
const tiles: [string, string][] = [["Sites live", "18 / 23"], ["Open blockers", "4"], ["Avg. complete", "72%"]];

export default function ReportPreview() {
  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-[0_20px_50px_-20px_rgba(42,68,81,0.35)]" role="img" aria-label="Preview of a SheetPress report with KPI tiles, a status breakdown and a sortable table">
      <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--bg)] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#d6dbe3]" /><span className="h-2.5 w-2.5 rounded-full bg-[#d6dbe3]" /><span className="h-2.5 w-2.5 rounded-full bg-[#d6dbe3]" />
        <span className="ml-3 truncate rounded-md bg-[var(--card)] px-3 py-1 text-xs text-[var(--mute)]">sheetpress.yeve.dev/r/q4-site-rollout</span>
      </div>
      <div className="p-4 text-left sm:p-6">
        <p className="text-lg font-bold">Q4 Site Rollout</p>
        <p className="mb-4 text-xs text-[var(--mute)]">Sample report · Updated today</p>
        <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
          {tiles.map(([l, v]) => (
            <div key={l} className="rounded-xl border border-[var(--line)] p-3">
              <p className="text-[11px] text-[var(--mute)] sm:text-xs">{l}</p>
              <p className="text-xl font-bold sm:text-2xl">{v}</p>
            </div>
          ))}
        </div>
        <div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-[var(--bg)]">
          <span className="bg-[var(--ok)]" style={{ width: "42%" }} /><span className="bg-[var(--prog)]" style={{ width: "26%" }} />
          <span className="bg-[var(--warn)]" style={{ width: "20%" }} /><span className="bg-[var(--bad)]" style={{ width: "12%" }} />
        </div>
        <div className="overflow-hidden rounded-lg border border-[var(--line)] text-sm">
          <div className="grid grid-cols-[1.1fr_1.6fr_1fr] gap-2 border-b border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--mute)] sm:grid-cols-[1fr_1.6fr_1fr_1fr]">
            <span>City</span><span>Site</span><span>Status</span><span className="hidden sm:block">Progress</span>
          </div>
          {rows.map(([city, site, tone, label, pct]) => (
            <div key={city} className="grid grid-cols-[1.1fr_1.6fr_1fr] items-center gap-2 border-b border-[var(--line)] px-3 py-2 last:border-0 sm:grid-cols-[1fr_1.6fr_1fr_1fr]">
              <span>{city}</span><span className="truncate text-[var(--accent)] underline">{site}</span>
              <span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${chip[tone]}`}>{label}</span></span>
              <span className="hidden items-center gap-2 sm:flex"><span className="h-2 w-16 overflow-hidden rounded bg-[var(--bg)]"><span className="block h-full bg-[var(--accent)]" style={{ width: `${pct}%` }} /></span><span className="text-xs text-[var(--mute)]">{pct}%</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
