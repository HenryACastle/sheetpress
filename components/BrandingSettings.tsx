"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_LOGO_DATA, PRESETS, accentReadable, HEX } from "@/lib/branding";
import { FREE } from "@/lib/plans";

type B = { logo?: string; link?: string; accent?: string; theme?: string; footer?: string; currency?: string; hideBadge?: boolean };
const field = "w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm";
const btn = "rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm hover:bg-[var(--bg)] disabled:opacity-50";
const primary = "rounded-lg bg-[var(--accent)] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50";

// Logo, colours, footer and the SheetPress line for one report. Saved choices win over the workbook's Settings sheet.
export default function BrandingSettings({ id, saved, workbook, title }: { id: string; saved: Record<string, unknown> | null; workbook: Record<string, unknown> | null; title: string }) {
  const router = useRouter();
  const start = { ...(workbook ?? {}), ...(saved ?? {}) } as B;
  const [b, setB] = useState<B>(start);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const theme = b.theme === "dark" ? "dark" : "light";
  const accent = b.accent && HEX.test(b.accent) ? b.accent : "#2a7f63";
  const set = (p: Partial<B>) => { setB((v) => ({ ...v, ...p })); setOk(""); };

  function upload(f: File | undefined) {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const d = String(r.result);
      if (d.length > MAX_LOGO_DATA) { setErr("That image is too large. Use one under about 100 KB, or paste an https:// address."); return; }
      setErr(""); set({ logo: d });
    };
    r.readAsDataURL(f);
  }
  async function send(body: unknown, msg: string) {
    setBusy(true); setErr(""); setOk("");
    try {
      const res = await fetch(`/api/reports/${id}/branding`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(j.error ?? "Could not save."); return; }
      setOk(msg); router.refresh();
      return j.branding as B;
    } catch { setErr("Network error. Try again."); }
    finally { setBusy(false); }
  }
  const dark = theme === "dark";
  return (
    <section className="space-y-3 text-sm" aria-label="Branding">
      <h4 className="font-semibold">Branding and colors</h4>
      <p className="text-xs text-[var(--mute)]">These choices override the Settings sheet in your workbook and stay when you upload a new version.</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Color presets">
        {PRESETS.map((p) => (
          <button key={p.name} type="button" onClick={() => set({ accent: p.accent, theme: p.theme })} className={btn}>
            <span aria-hidden className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ background: p.accent }} />{p.name}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium">Accent color
          <div className="mt-1 flex gap-2"><input type="color" value={accent} onChange={(e) => set({ accent: e.target.value })} aria-label="Pick accent color" className="h-9 w-12 rounded border border-[var(--line)] bg-white" />
            <input value={b.accent ?? ""} onChange={(e) => set({ accent: e.target.value })} placeholder="#2a7f63" className={field} /></div>
        </label>
        <label className="block text-xs font-medium">Theme
          <select value={theme} onChange={(e) => set({ theme: e.target.value })} className={`${field} mt-1`}><option value="light">Light</option><option value="dark">Dark</option></select>
        </label>
        <label className="block text-xs font-medium">Logo (https address)
          <input value={b.logo?.startsWith("data:") ? "" : b.logo ?? ""} onChange={(e) => set({ logo: e.target.value })} placeholder="https://example.com/logo.png" className={`${field} mt-1`} />
        </label>
        <label className="block text-xs font-medium">or upload a small image (PNG, JPEG, WebP, SVG)
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(e) => upload(e.target.files?.[0])} className="mt-1 block w-full text-xs" />
        </label>
        <label className="block text-xs font-medium">Logo link (optional)
          <input value={b.link ?? ""} onChange={(e) => set({ link: e.target.value })} placeholder="https://yoursite.com" className={`${field} mt-1`} />
        </label>
        <label className="block text-xs font-medium">Currency symbol
          <input value={b.currency ?? ""} onChange={(e) => set({ currency: e.target.value })} maxLength={3} placeholder="$" className={`${field} mt-1`} />
        </label>
      </div>
      <label className="block text-xs font-medium">Footer text (up to 140 characters)
        <input value={b.footer ?? ""} onChange={(e) => set({ footer: e.target.value })} maxLength={140} className={`${field} mt-1`} />
      </label>
      {FREE.hideBadge && (
        <label className="flex items-start gap-2"><input type="checkbox" checked={!!b.hideBadge} onChange={(e) => set({ hideBadge: e.target.checked })} className="mt-1" />
          <span><b>Hide the &ldquo;Built with SheetPress&rdquo; line</b><span className="block text-xs text-[var(--mute)]">Also removed from the password page.</span></span></label>
      )}
      {b.accent && HEX.test(b.accent) && !accentReadable(b.accent, theme) && (
        <p role="alert" className="text-xs text-[var(--warn)]">This color is hard to read on a {theme} background. Pick a {dark ? "lighter" : "darker"} one for links and buttons.</p>
      )}
      <div aria-label="Preview" className="rounded-lg border border-[var(--line)] p-4" style={{ background: dark ? "#16242b" : "#f0f2f5", color: dark ? "#e7edf0" : "#2a4451" }}>
        {b.logo && /^(https:|data:image)/.test(b.logo) && /* eslint-disable-next-line @next/next/no-img-element */ <img src={b.logo} alt="" style={{ maxHeight: 36, maxWidth: 180, marginBottom: 8 }} referrerPolicy="no-referrer" />}
        <div className="font-semibold">{title}</div>
        <div style={{ color: accent, fontWeight: 600 }}>Accent sample</div>
        <div className="mt-2 text-xs opacity-80">{b.footer}{b.footer && !b.hideBadge ? " · " : ""}{b.hideBadge ? "" : "Built with SheetPress"}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => send(b, "Saved. Open the report to see it.")} className={primary}>{busy ? "Saving..." : "Save branding"}</button>
        <button type="button" disabled={busy} onClick={async () => { if (await send({ reset: true }, "Back to the workbook's Settings.")) setB((workbook ?? {}) as B); }} className={btn}>Reset to workbook</button>
      </div>
      {ok && <p role="status" className="text-xs text-[var(--ok)]">{ok}</p>}
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
    </section>
  );
}
