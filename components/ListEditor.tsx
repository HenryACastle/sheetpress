"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Sheet } from "@/lib/report";
import { cleanName, hiddenCounts, isHiddenName, isShowColumn, rowIsHidden } from "@/lib/visibility";

type Cell = string | number;
const input = "w-full min-w-[4rem] rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm hover:border-[var(--line)] focus:border-[var(--accent)] focus:bg-white focus:outline-none";
const btn = "rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm hover:bg-[var(--bg)] disabled:opacity-50";

const NUMERIC = /^(qty|quantity|price|cost|amount|total|count|number|#)$/i;
const isStatus = (h: string) => /^(status|state)$/i.test(cleanName(h));
const BOUGHT = /^(bought|done|got it|have|complete|completed|purchased)$/i;

export default function ListEditor({ id, slug, title, sheets: initial }: { id: string; slug: string; title: string; sheets: Sheet[] }) {
  const router = useRouter();
  const tabs = initial.map((s, i) => i).filter((i) => initial[i].kind === "table");
  const [sheets, setSheets] = useState<Sheet[]>(initial);
  const [cur, setCur] = useState(tabs[0] ?? 0);
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [busyUp, setBusyUp] = useState(false);
  const quick = useRef<HTMLInputElement>(null);
  const s = sheets[cur];
  const showCol = s.headers.findIndex(isShowColumn);
  const statusCol = s.headers.findIndex(isStatus);
  const numeric = s.headers.map((h) => NUMERIC.test(cleanName(h)));

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    const key = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); void save(); } };
    window.addEventListener("beforeunload", warn); window.addEventListener("keydown", key);
    return () => { window.removeEventListener("beforeunload", warn); window.removeEventListener("keydown", key); };
  });

  function patch(fn: (x: Sheet) => Sheet) {
    setSheets((all) => all.map((x, i) => (i === cur ? fn(x) : x))); setDirty(true); setState("idle");
  }
  const setCell = (r: number, c: number, v: Cell) => patch((x) => ({ ...x, rows: x.rows.map((row, i) => (i === r ? row.map((cv, ci) => (ci === c ? v : cv)) : row)) }));
  const delRow = (r: number) => patch((x) => ({ ...x, rows: x.rows.filter((_, i) => i !== r) }));
  function toggleColumn(c: number) {
    patch((x) => ({ ...x, headers: x.headers.map((h, i) => (i === c ? (isHiddenName(h) ? cleanName(h) : `${cleanName(h)} [private]`) : h)) }));
  }
  function addRow(first: string) {
    patch((x) => ({
      ...x,
      rows: [...x.rows, x.headers.map((h, i) => {
        const n = cleanName(h);
        if (i === 0) return first;
        if (isShowColumn(h)) return "yes";
        if (isStatus(h)) return "Needed";
        if (/^(qty|quantity)$/i.test(n)) return 1;
        return "";
      })],
    }));
  }

  // "9." or "9.50" is kept as typed while editing; on save a number column holds real numbers.
  const clean = (x: Sheet): Sheet => ({ ...x, rows: x.rows.map((r) => r.map((v, ci) => (NUMERIC.test(cleanName(x.headers[ci])) && typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)) ? Number(v) : v))) });
  async function save() {
    setState("saving"); setError("");
    try {
      const res = await fetch(`/api/reports/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ sheets: sheets.map(clean) }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setState("error"); setError(j.error ?? "Could not save."); return; }
      setDirty(false); setState("saved");
    } catch { setState("error"); setError("Network error. Try again."); }
  }
  async function upload(file: File) {
    if (dirty && !confirm("Uploading replaces the list, including your unsaved changes. Continue?")) return;
    setBusyUp(true); setError("");
    try {
      const fd = new FormData(); fd.set("file", file); fd.set("title", title);
      const res = await fetch(`/api/reports/${id}`, { method: "PUT", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error ?? "Upload failed."); return; }
      router.refresh(); window.location.reload();
    } catch { setError("Network error. Try again."); }
    finally { setBusyUp(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(`${window.location.origin}/r/${slug}`); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }

  const stats = useMemo(() => {
    const q = s.headers.findIndex((h) => /^(qty|quantity)$/i.test(cleanName(h)));
    const p = s.headers.findIndex((h) => /^(price|cost)$/i.test(cleanName(h)));
    let total = 0, bought = 0;
    for (const r of s.rows) {
      const price = typeof r[p] === "number" ? (r[p] as number) : parseFloat(String(r[p] ?? ""));
      const qty = q >= 0 ? (typeof r[q] === "number" ? (r[q] as number) : parseFloat(String(r[q] ?? "")) || 1) : 1;
      if (p >= 0 && !isNaN(price)) total += price * qty;
      if (statusCol >= 0 && BOUGHT.test(String(r[statusCol] ?? "").trim())) bought++;
    }
    return { total, bought, hasPrice: p >= 0 };
  }, [s, statusCol]);
  const hidden = hiddenCounts({ title, subtitle: "", generated: "", sheets: [s] });

  return (
    <div className="mt-3 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{title}</h1>
          <p className="text-sm text-[var(--mute)]">
            {s.rows.length} items{statusCol >= 0 ? ` · ${stats.bought} bought` : ""}{stats.hasPrice ? ` · est. total $${stats.total.toFixed(2)}` : ""}
            {(hidden.rows || hidden.columns) ? ` · hidden from the public: ${[hidden.rows && `${hidden.rows} rows`, hidden.columns && `${hidden.columns} columns`].filter(Boolean).join(", ")}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/r/${slug}`} target="_blank" rel="noopener noreferrer" className={btn}>Open public page</a>
          <button type="button" onClick={copy} className={btn}>{copied ? "Copied" : "Copy link"}</button>
          <button type="button" onClick={save} disabled={!dirty || state === "saving"} className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50">
            {state === "saving" ? "Saving..." : dirty ? "Save changes" : state === "saved" ? "Saved" : "Saved"}
          </button>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-[var(--bad)]">{error}</p>}

      {tabs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((i) => <button key={i} onClick={() => setCur(i)} className={`${btn} ${i === cur ? "border-[var(--accent)] font-semibold" : ""}`}>{cleanName(sheets[i].name)}</button>)}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); const v = quick.current?.value.trim(); if (v) { addRow(v); if (quick.current) quick.current.value = ""; } }} className="flex gap-2">
        <input ref={quick} placeholder={`Add to the list: type ${cleanName(s.headers[0]).toLowerCase()} and press Enter`} className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm" aria-label="Add an item" />
        <button type="submit" className={btn}>Add</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-[var(--card)]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] text-left text-[var(--mute)]">
              {s.headers.map((h, c) => (
                <th key={c} className="whitespace-nowrap px-2 py-2 font-medium">
                  <span className={isHiddenName(h) ? "opacity-60" : ""}>{cleanName(h)}</span>
                  {c !== showCol && (
                    <button type="button" onClick={() => toggleColumn(c)} title={isHiddenName(h) ? "Private: click to show on the public page" : "Public: click to hide from the public page"}
                      className={`ml-1.5 rounded-full border px-1.5 text-[11px] ${isHiddenName(h) ? "border-[var(--bad)] text-[var(--bad)]" : "border-[var(--line)]"}`}>
                      {isHiddenName(h) ? "private" : "public"}
                    </button>
                  )}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {s.rows.map((r, ri) => (
              <tr key={ri} className={`border-b border-[var(--line)] last:border-0 ${showCol >= 0 && rowIsHidden(r[showCol]) ? "bg-[var(--bg)]" : ""} ${statusCol >= 0 && BOUGHT.test(String(r[statusCol])) ? "text-[var(--mute)]" : ""}`}>
                {r.map((v, ci) => (
                  <td key={ci} className="px-1 py-0.5">
                    {ci === showCol ? (
                      <label className="flex items-center gap-1.5 whitespace-nowrap px-2 text-xs"><input type="checkbox" checked={!rowIsHidden(v)} onChange={(e) => setCell(ri, ci, e.target.checked ? "yes" : "no")} /> On site</label>
                    ) : ci === statusCol ? (
                      <label className="flex items-center gap-1.5 whitespace-nowrap px-2 text-xs"><input type="checkbox" checked={BOUGHT.test(String(v))} onChange={(e) => setCell(ri, ci, e.target.checked ? "Bought" : "Needed")} /> {BOUGHT.test(String(v)) ? "Bought" : "Needed"}</label>
                    ) : numeric[ci] ? (
                      <input className={`${input} text-right`} inputMode="decimal" value={v === "" ? "" : String(v)} onChange={(e) => { const t = e.target.value; const n = Number(t); setCell(ri, ci, t === "" ? "" : isNaN(n) || String(n) !== t ? t : n); }} aria-label={`${cleanName(s.headers[ci])}, row ${ri + 1}`} />
                    ) : (
                      <input className={input} value={String(v)} onChange={(e) => setCell(ri, ci, e.target.value)} aria-label={`${cleanName(s.headers[ci])}, row ${ri + 1}`} />
                    )}
                  </td>
                ))}
                <td className="px-1 text-center"><button type="button" onClick={() => delRow(ri)} className="rounded px-1.5 text-[var(--mute)] hover:text-[var(--bad)]" aria-label={`Delete row ${ri + 1}`}>&times;</button></td>
              </tr>
            ))}
            {!s.rows.length && <tr><td colSpan={s.headers.length + 1} className="p-6 text-center text-[var(--mute)]">Nothing here yet. Add the first item above.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a href={`/api/reports/${id}/xlsx`} className={btn}>Download Excel</a>
        <label className={`${btn} cursor-pointer`}>
          {busyUp ? "Uploading..." : "Upload Excel (replaces the list)"}
          <input type="file" accept=".xlsx" className="hidden" disabled={busyUp} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
        </label>
        <span className="text-xs text-[var(--mute)]">The Excel download has everything, including private rows and columns.</span>
      </div>

      <details className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium">What shows on the public page (show codes)</summary>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[var(--mute)]">
          <li><b>Row:</b> the <b>On site</b> box (the <b>Show</b> column in Excel: yes / no). Unticked rows are removed from the public page.</li>
          <li><b>Column:</b> the <b>public / private</b> badge on each heading. In Excel, add <b>[private]</b> to a header, like <b>Price [private]</b>.</li>
          <li><b>Sheet:</b> in Excel, add <b>(private)</b> to the sheet name to hide the whole sheet.</li>
          <li>Hidden data is removed on the server before the page is sent, so it is not in the page source either.</li>
        </ul>
      </details>
    </div>
  );
}
