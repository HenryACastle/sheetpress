"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AccessSettings from "./AccessSettings";
import BrandingSettings from "./BrandingSettings";
import LinkSettings from "./LinkSettings";
import ReportForm from "./ReportForm";

export type CardReport = { id: string; slug: string; title: string; subtitle: string; protectedByPassword: boolean; sheetCount: number; rowCount: number; updatedAt: string; editable?: boolean; customDomain?: string | null; domainVerified?: boolean; accessMode?: string; branding?: Record<string, unknown> | null; workbookBrand?: Record<string, unknown> | null };

type TabId = "update" | "access" | "branding" | "link";

export default function ReportCard({ r, domainsEnabled = false }: { r: CardReport; domainsEnabled?: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId | null>(null); // one settings tab open at a time
  const [copied, setCopied] = useState(false);
  const liveDomain = r.customDomain && r.domainVerified ? r.customDomain : null;
  const path = `/r/${r.slug}`;

  async function copy() {
    try { await navigator.clipboard.writeText(liveDomain ? `https://${liveDomain}` : window.location.origin + path); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }
  async function remove() {
    if (!confirm(`Delete "${r.title}"? The link will stop working.`)) return;
    const res = await fetch(`/api/reports/${r.id}`, { method: "DELETE" });
    if (res.ok) router.refresh(); else alert("Could not delete. Try again.");
  }
  const tabs: [TabId, string][] = [["update", "Update"], ["access", "Access"], ...(r.accessMode !== "legacy" ? [["branding", "Branding"] as [TabId, string]] : []), ["link", "Link & domain"]];
  const btn = "rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm hover:bg-[var(--bg)]";
  return (
    <li className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{r.title}</h3>
          <p className="text-sm text-[var(--mute)]">
            {r.editable ? "Editable list · " : ""}{r.accessMode === "legacy" ? "Password protected (old style)" : r.protectedByPassword ? "Password protected" : "Public link"} · {r.sheetCount} sheets · {r.rowCount} rows · updated {new Date(r.updatedAt).toLocaleDateString()}
          </p>
          {liveDomain && <p className="text-sm"><a href={`https://${liveDomain}`} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline">{liveDomain}</a></p>}
          {r.customDomain && !r.domainVerified && <p className="text-xs text-[var(--warn)]">{r.customDomain} is waiting for DNS</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {r.editable && <Link href={`/app/lists/${r.id}`} className={`${btn} font-semibold`}>Edit list</Link>}
          <a href={liveDomain ? `https://${liveDomain}` : path} target="_blank" rel="noopener noreferrer" className={btn}>Open</a>
          <button onClick={copy} className={btn}>{copied ? "Copied" : "Copy link"}</button>
          <button onClick={remove} className={`${btn} text-red-600`}>Delete</button>
        </div>
      </div>
      <div className="mt-4 border-t border-[var(--line)]">
        <div role="tablist" aria-label={`Settings for ${r.title}`} className="-mb-px flex flex-wrap items-center gap-1 pt-2">
          {tabs.map(([id, label]) => (
            <button key={id} role="tab" id={`tab-${r.id}-${id}`} aria-selected={tab === id} aria-controls={`panel-${r.id}-${id}`} onClick={() => setTab(id)}
              className={`rounded-t-lg border border-b-0 px-3.5 py-2 text-sm ${tab === id ? "border-[var(--line)] bg-white font-semibold text-[var(--ink)]" : "border-transparent text-[var(--mute)] hover:text-[var(--ink)]"}`}>{label}</button>
          ))}
          {tab && <button onClick={() => setTab(null)} className="ml-auto px-2 py-2 text-sm text-[var(--mute)] hover:text-[var(--ink)]">Close</button>}
        </div>
        {tab && (
          <div role="tabpanel" id={`panel-${r.id}-${tab}`} aria-labelledby={`tab-${r.id}-${tab}`} className="rounded-b-lg rounded-tr-lg border border-[var(--line)] bg-white p-4">
            {tab === "update" && <ReportForm id={r.id} initialTitle={r.title} initialSubtitle={r.subtitle} legacy={r.accessMode === "legacy"} onDone={() => setTab(null)} />}
            {tab === "access" && <AccessSettings id={r.id} mode={r.accessMode === "password" ? "password" : r.accessMode === "legacy" ? "legacy" : "public"} shareUrl={liveDomain ? `https://${liveDomain}` : typeof window !== "undefined" ? window.location.origin + path : path} />}
            {tab === "branding" && <BrandingSettings id={r.id} saved={r.branding ?? null} workbook={r.workbookBrand ?? null} title={r.title} />}
            {tab === "link" && <LinkSettings id={r.id} slug={r.slug} customDomain={r.customDomain ?? null} domainVerified={!!r.domainVerified} enabled={domainsEnabled} host={typeof window !== "undefined" ? window.location.host : ""} />}
          </div>
        )}
      </div>
    </li>
  );
}
