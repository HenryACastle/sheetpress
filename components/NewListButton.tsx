"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Starts an editable shopping list from the template. No Excel needed; Excel upload and download still work on it.
export default function NewListButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function create() {
    const title = window.prompt("Name your shopping list", "Shopping list");
    if (title === null) return;
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/lists", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setError(j.error ?? "Could not create the list."); return; }
      router.push(`/app/lists/${j.id}`);
    } catch { setError("Network error. Try again."); }
    finally { setBusy(false); }
  }
  return (
    <div>
      <button type="button" onClick={create} disabled={busy} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50">
        {busy ? "Creating..." : "New shopping list"}
      </button>
      <a href="/examples/shopping-list.xlsx" className="ml-3 text-sm underline">Download the Excel template</a>
      {error && <p role="alert" className="mt-2 text-sm text-[var(--bad)]">{error}</p>}
    </div>
  );
}
