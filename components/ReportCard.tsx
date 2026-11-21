"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ReportForm from "./ReportForm";

export type CardReport = { id: string; slug: string; title: string; subtitle: string; protectedByPassword: boolean; sheetCount: number; rowCount: number; updatedAt: string; editable?: boolean };

export default function ReportCard({ r }: { r: CardReport }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const path = `/r/${r.slug}`;

  async function copy() {
    try { await navigator.clipboard.writeText(window.location.origin + path); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  }
  async function remove() {
    if (!confirm(`Delete "${r.title}"? The link will stop working.`)) return;
    const res = await fetch(`/api/reports/${r.id}`, { method: "DELETE" });
    if (res.ok) router.refresh(); else alert("Could not delete. Try again.");
  }
  const btn = "rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm hover:bg-[var(--bg)]";
  return (
    <li className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{r.title}</h3>
          <p className="text-sm text-[var(--mute)]">
            {r.editable ? "Editable list · " : ""}{r.protectedByPassword ? "Password protected" : "Public link"} · {r.sheetCount} sheets · {r.rowCount} rows · updated {new Date(r.updatedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {r.editable && <Link href={`/app/lists/${r.id}`} className={`${btn} font-semibold`}>Edit list</Link>}
          <a href={path} target="_blank" rel="noopener noreferrer" className={btn}>Open</a>
          <button onClick={copy} className={btn}>{copied ? "Copied" : "Copy link"}</button>
          <button onClick={() => setEditing((v) => !v)} className={btn}>{editing ? "Cancel" : "Update"}</button>
          <button onClick={remove} className={`${btn} text-red-600`}>Delete</button>
        </div>
      </div>
      {editing && (
        <div className="mt-4 border-t border-[var(--line)] pt-4">
          <ReportForm id={r.id} initialTitle={r.title} initialSubtitle={r.subtitle} onDone={() => setEditing(false)} />
        </div>
      )}
    </li>
  );
}
