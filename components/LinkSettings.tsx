"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type DnsRecord = { type: "A" | "CNAME" | "TXT"; name: string; value: string; purpose: string };
type Status = { domain: string; state: "needs_txt" | "needs_dns" | "live"; records: DnsRecord[]; isApex: boolean; message: string };

const field = "w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm";
const btn = "rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm hover:bg-[var(--bg)] disabled:opacity-60";
const primary = "rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60";
const POLL_MS = 15000, POLL_MAX = 60; // check every 15s for 15 minutes, then wait for a manual "Check now"

function Copy({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" aria-label={`Copy ${label}`} onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1200); } catch {} }}
      className="ml-2 rounded border border-[var(--line)] px-1.5 py-0.5 text-xs hover:bg-[var(--bg)]">{done ? "Copied" : "Copy"}</button>
  );
}

export default function LinkSettings({ id, slug, customDomain, domainVerified, enabled, host }: {
  id: string; slug: string; customDomain: string | null; domainVerified: boolean; enabled: boolean; host: string;
}) {
  const router = useRouter();
  // ---- link name ----
  const [name, setName] = useState(slug);
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function saveName() {
    setNameBusy(true); setNameMsg(null);
    const res = await fetch(`/api/reports/${id}/slug`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: name }) });
    const j = await res.json().catch(() => ({}));
    setNameBusy(false);
    if (!res.ok) { setNameMsg({ ok: false, text: j.error ?? "Could not save." }); return; }
    setName(j.slug); setNameMsg({ ok: true, text: "Saved. The old link no longer works." }); router.refresh();
  }

  // ---- custom domain ----
  const [domain, setDomain] = useState(customDomain ?? "");
  const [status, setStatus] = useState<Status | null>(customDomain && domainVerified ? { domain: customDomain, state: "live", records: [], isApex: false, message: "Your domain is live." } : null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const polls = useRef(0);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/reports/${id}/domain`);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { setErr(j.error ?? "Could not check the domain."); return; }
    setErr(""); setStatus(j.status);
    if (j.status?.state === "live") router.refresh();
  }, [id, router]);

  // A domain that is attached but not live yet: fetch instructions now and keep checking.
  const pending = !!customDomain && status?.state !== "live";
  useEffect(() => {
    if (!enabled || !pending) return;
    polls.current = 0;
    const first = setTimeout(refresh, 0);
    const t = setInterval(() => { if (++polls.current > POLL_MAX) { clearInterval(t); return; } refresh(); }, POLL_MS);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [enabled, pending, refresh]);

  async function connect(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const res = await fetch(`/api/reports/${id}/domain`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ domain }) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(j.error ?? "Could not connect that domain."); return; }
    setStatus(j.status); router.refresh();
  }
  async function checkNow() { setBusy(true); await refresh(); setBusy(false); }
  async function remove() {
    if (!confirm(`Disconnect ${status?.domain ?? customDomain}? Visitors to that address will see an error.`)) return;
    setBusy(true); setErr("");
    const res = await fetch(`/api/reports/${id}/domain`, { method: "DELETE" });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(j.error ?? "Could not remove the domain."); return; }
    setStatus(null); setDomain(""); router.refresh();
  }

  const attached = status?.domain ?? customDomain;
  return (
    <div className="space-y-6 text-sm">
      <section aria-labelledby={`ln-${id}`}>
        <h4 id={`ln-${id}`} className="font-semibold">Link name</h4>
        <p className="mt-1 text-[var(--mute)]">Choose a short, memorable address for this report.</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[var(--mute)]">{host}/r/</span>
          <input aria-label="Link name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className={`${field} max-w-[16rem]`} />
          <button type="button" onClick={saveName} disabled={nameBusy || name === slug} className={btn}>{nameBusy ? "Saving..." : "Save"}</button>
        </div>
        {nameMsg && <p role="status" className={`mt-2 ${nameMsg.ok ? "text-[var(--ok)]" : "text-red-600"}`}>{nameMsg.text}</p>}
      </section>

      <section aria-labelledby={`cd-${id}`}>
        <h4 id={`cd-${id}`} className="font-semibold">Your own domain</h4>
        {!enabled ? (
          <p className="mt-1 text-[var(--mute)]">Custom domains are coming soon.</p>
        ) : !attached ? (
          <form onSubmit={connect} className="mt-1">
            <p className="text-[var(--mute)]">Show this report at your own address, for example <b>reports.yourcompany.com</b>. A subdomain like that is the easiest to set up.</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input aria-label="Domain" required value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="reports.yourcompany.com" className={`${field} max-w-[20rem]`} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
              <button disabled={busy} className={primary}>{busy ? "Connecting..." : "Connect domain"}</button>
            </div>
          </form>
        ) : (
          <div className="mt-2 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono">{attached}</span>
              {status?.state === "live"
                ? <span className="rounded-full bg-[var(--okbg)] px-2 py-0.5 text-xs font-semibold text-[var(--ok)]">Live</span>
                : <span className="rounded-full bg-[var(--warnbg)] px-2 py-0.5 text-xs font-semibold text-[var(--warn)]">{status?.state === "needs_txt" ? "Needs verification" : "Waiting for DNS"}</span>}
            </div>
            {status?.state === "live" ? (
              <p><a href={`https://${attached}`} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline">Open https://{attached}</a></p>
            ) : (
              <>
                <p className="text-[var(--mute)]">{status?.message ?? "Checking your domain..."}</p>
                {status && status.records.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-[var(--line)]">
                    <table className="w-full min-w-[30rem] text-left">
                      <thead className="bg-[var(--bg)] text-xs text-[var(--mute)]"><tr><th className="px-3 py-2">Type</th><th className="px-3 py-2">Name / Host</th><th className="px-3 py-2">Value</th></tr></thead>
                      <tbody>
                        {status.records.map((r) => (
                          <tr key={r.type + r.name} className="border-t border-[var(--line)] align-top">
                            <td className="px-3 py-2 font-semibold">{r.type}</td>
                            <td className="px-3 py-2 font-mono">{r.name}<Copy text={r.name} label="name" /></td>
                            <td className="break-all px-3 py-2 font-mono">{r.value}<Copy text={r.value} label="value" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--mute)]">
                  <li>Add these at the company where you manage your domain&rsquo;s DNS (GoDaddy, Namecheap, Cloudflare, Squarespace, and so on).</li>
                  <li>On Cloudflare, set the record to <b>DNS only</b> (grey cloud), not proxied.</li>
                  <li>It usually works within minutes. We check every 15 seconds while this panel is open.</li>
                </ul>
              </>
            )}
            <div className="flex flex-wrap gap-2">
              {status?.state !== "live" && <button type="button" onClick={checkNow} disabled={busy} className={btn}>{busy ? "Checking..." : "Check now"}</button>}
              <button type="button" onClick={remove} disabled={busy} className={`${btn} text-red-600`}>Remove domain</button>
            </div>
          </div>
        )}
        {err && <p role="alert" className="mt-2 text-red-600">{err}</p>}
      </section>
    </div>
  );
}
