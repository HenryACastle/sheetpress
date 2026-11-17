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

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true); setError("");
    const form = e.currentTarget;
    try {
      const res = await fetch(id ? `/api/reports/${id}` : "/api/reports", { method: id ? "PUT" : "POST", body: new FormData(form) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error ?? "Upload failed."); return; }
      form.reset(); onDone?.(); router.refresh();
    } catch { setError("Network error. Try again."); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">Title
          <input name="title" required maxLength={80} defaultValue={initialTitle} placeholder="Barcrawlerz progress" className={`${input} mt-1`} />
        </label>
        <label className="block text-sm font-medium">Subtitle <span className="font-normal text-[var(--mute)]">(optional)</span>
          <input name="subtitle" maxLength={160} defaultValue={initialSubtitle} placeholder="Weekly SEO status" className={`${input} mt-1`} />
        </label>
      </div>
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
  );
}
