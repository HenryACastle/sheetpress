import { rollout } from "@/scripts/demo-data";

// Decorative preview of a published report. Reads the SAME data as the live demo
// (scripts/demo-data.ts), so the hero never disagrees with /r/demo-q4-site-rollout.
const tone = (s: string) => /^done/i.test(s) ? "ok" : /progress/i.test(s) ? "prog" : /blocked/i.test(s) ? "bad" : "warn";
const chip: Record<string, string> = { ok: "bg-[var(--okbg)] text-[var(--ok)]", prog: "bg-[var(--progbg)] text-[var(--prog)]", bad: "bg-[var(--badbg)] text-[var(--bad)]", warn: "bg-[var(--warnbg)] text-[var(--warn)]" };
const bar: Record<string, string> = { ok: "bg-[var(--ok)]", prog: "bg-[var(--prog)]", bad: "bg-[var(--bad)]", warn: "bg-[var(--warn)]" };

export default function ReportPreview() {
  const summary = rollout.sheets[0].rows.slice(0, 3);
  const sites = rollout.sheets[1].rows;
  const counts: Record<string, number> = {};
  sites.forEach((r) => { const t = tone(String(r[2])); counts[t] = (counts[t] ?? 0) + 1; });
  const shown = sites.slice(0, 6);
  return (
    <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-[0_20px_50px_-20px_rgba(42,68,81,0.35)]" role="img" aria-label="Preview of a SheetPress report with KPI tiles, a status breakdown and a sortable table">
      <div className="flex items-center gap-2 border-b border-[var(--line)] bg-[var(--bg)] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#d6dbe3]" /><span className="h-2.5 w-2.5 rounded-full bg-[#d6dbe3]" /><span className="h-2.5 w-2.5 rounded-full bg-[#d6dbe3]" />
        <span className="ml-3 truncate rounded-md bg-[var(--card)] px-3 py-1 text-xs text-[var(--mute)]">your-domain.com/r/{rollout.slug.replace("demo-", "")}</span>
      </div>
      <div className="p-4 text-left sm:p-6">
        <p className="text-lg font-bold">{rollout.title}</p>
        <p className="mb-4 text-xs text-[var(--mute)]">Sample report · Fictional data</p>
        <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
          {summary.map((r) => (
            <div key={String(r[0])} className="rounded-xl border border-[var(--line)] p-3">
              <p className="text-[11px] text-[var(--mute)] sm:text-xs">{r[0]}</p>
              <p className="text-xl font-bold sm:text-2xl">{r[1]}</p>
            </div>
          ))}
        </div>
        <div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-[var(--bg)]">
          {["ok", "prog", "warn", "bad"].map((k) => counts[k] ? <span key={k} className={bar[k]} style={{ width: `${(counts[k] / sites.length) * 100}%` }} /> : null)}
        </div>
        <div className="overflow-hidden rounded-lg border border-[var(--line)] text-sm">
          <div className="grid grid-cols-[1.1fr_1.6fr_1fr] gap-2 border-b border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--mute)] sm:grid-cols-[1fr_1.6fr_1fr_1fr]">
            <span>City</span><span>Site</span><span>Launch</span><span className="hidden sm:block">Progress</span>
          </div>
          {shown.map((r) => {
            const t = tone(String(r[2])); const pct = Math.round(Number(r[5]) * 100);
            return (
              <div key={String(r[0])} className="grid grid-cols-[1.1fr_1.6fr_1fr] items-center gap-2 border-b border-[var(--line)] px-3 py-2 last:border-0 sm:grid-cols-[1fr_1.6fr_1fr_1fr]">
                <span>{r[0]}</span><span className="truncate text-[var(--accent)] underline">{String(r[1]).replace("https://", "")}</span>
                <span><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${chip[t]}`}>{r[2]}</span></span>
                <span className="hidden items-center gap-2 sm:flex"><span className="h-2 w-16 overflow-hidden rounded bg-[var(--bg)]"><span className="block h-full bg-[var(--accent)]" style={{ width: `${pct}%` }} /></span><span className="text-xs text-[var(--mute)]">{pct}%</span></span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
