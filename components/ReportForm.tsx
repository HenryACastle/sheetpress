"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const input = "w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm";

export default function ReportForm({ id, initialTitle = "", initialSubtitle = "", onDone }: {
  id?: string; initialTitle?: string; initialSubtitle?: string; onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [published, setPublished] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError(""); setPublished(null);
    const form = e.currentTarget;
    try {
      const res = await fetch(id ? `/api/reports/${id}` : "/api/reports", { method: id ? "PUT" : "POST", body: new FormData(form) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error ?? "Upload failed."); return; }
      form.reset();
      if (!id && json.slug) setPublished(json.slug);
      onDone?.(); router.refresh();
    } catch { setError("Network error. Try again."); }
    finally { setBusy(false); }
  }

  const link = published && typeof window !== "undefined" ? `${window.location.origin}/r/${published}` : "";
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }

  return (
    <>
    {published && (
      <div role="status" className="mb-4 rounded-lg border border-[var(--brand-green)] bg-[var(--accent-tint)] p-4">
        <p className="font-semibold">Your report is live</p>
        <p className="mt-1 break-all text-sm text-[var(--slate)]">{link}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`/r/${published}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]">Open report</a>
          <button type="button" onClick={copy} className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm hover:bg-[var(--bg)]">{copied ? "Copied" : "Copy link"}</button>
        </div>
      </div>
    )}
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">Title
          <input name="title" maxLength={80} defaultValue={initialTitle} placeholder="Barcrawlerz progress" className={`${input} mt-1`} />
        </label>
        <label className="block text-sm font-medium">Subtitle <span className="font-normal text-[var(--mute)]">(optional)</span>
          <input name="subtitle" maxLength={160} defaultValue={initialSubtitle} placeholder="Weekly SEO status" className={`${input} mt-1`} />
        </label>
      </div>
      {!id && (
        <label className="block text-sm font-medium">Link name <span className="font-normal text-[var(--mute)]">(optional, letters, numbers and dashes)</span>
          <input name="slug" maxLength={60} placeholder="acme-q4-report" className={`${input} mt-1 sm:max-w-sm`} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </label>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">Excel file (.xlsx, up to 2 MB)
          <input name="file" type="file" required accept=".xlsx" className={`${input} mt-1`} />
        </label>
        <label className="block text-sm font-medium">Password <span className="font-normal text-[var(--mute)]">(optional, leave blank for a public link)</span>
          <input name="password" type="password" autoComplete="new-password" minLength={6} className={`${input} mt-1`} />
        </label>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button disabled={busy} className="rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
        {busy ? "Publishing..." : id ? "Replace workbook" : "Publish report"}
      </button>
    </form>
    </>
  );
}
