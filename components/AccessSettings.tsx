"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const field = "w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm";
const btn = "rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-sm hover:bg-[var(--bg)] disabled:opacity-50";
const primary = "rounded-lg bg-[var(--accent)] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[var(--accent-hover)] disabled:opacity-50";

// A readable strong password: three words plus digits, from the browser's secure random source.
const WORDS = ["amber", "bridge", "cedar", "dune", "ember", "fjord", "garnet", "harbor", "iris", "juniper", "kelp", "lantern", "meadow", "nectar", "orchid", "pebble", "quartz", "reef", "sable", "thistle", "umber", "violet", "willow", "yarrow", "zephyr"];
function generate(): string {
  const r = new Uint32Array(4); crypto.getRandomValues(r);
  return `${WORDS[r[0] % WORDS.length]}-${WORDS[r[1] % WORDS.length]}-${WORDS[r[2] % WORDS.length]}-${String(r[3] % 10000).padStart(4, "0")}`;
}

// Who can open the report. Separate from the workbook. Public or password today; specific people by email later.
export default function AccessSettings({ id, mode, shareUrl }: { id: string; mode: "public" | "password" | "legacy"; shareUrl: string }) {
  const router = useRouter();
  const [current, setCurrent] = useState(mode);
  const [want, setWant] = useState<"public" | "password">(mode === "password" ? "password" : "public");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState<{ mode: "public" | "password"; pw?: string } | null>(null);
  const [copied, setCopied] = useState("");

  async function save(m: "public" | "password") {
    if (m === "public" && current === "password" && !confirm("Make this report public? Anyone with the link will be able to open it.")) return;
    setBusy(true); setErr(""); setSaved(null);
    try {
      const res = await fetch(`/api/reports/${id}/access`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: m, password: m === "password" ? pw : undefined }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(j.error ?? "Could not save."); return; }
      setCurrent(m); setSaved({ mode: m, pw: m === "password" ? pw : undefined }); setPw(""); setShow(false); router.refresh();
    } catch { setErr("Network error. Try again."); }
    finally { setBusy(false); }
  }
  async function copy(text: string, what: string) {
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(""), 1500); } catch {}
  }

  const protectedNow = current === "password";
  return (
    <section aria-labelledby={`ac-${id}`} className="space-y-3 text-sm">
      <h4 id={`ac-${id}`} className="font-semibold">Who can open this report</h4>
      {current === "legacy" && (
        <p className="rounded-lg border border-[var(--line)] bg-[var(--bg)] p-3 text-xs text-[var(--mute)]">
          This report uses the older browser-encrypted password, which cannot be changed from here. Use <b>Update</b> and enter a new password to move it to the new access settings.
        </p>
      )}
      {current !== "legacy" && (
        <>
          <fieldset className="space-y-2">
            <legend className="sr-only">Access</legend>
            <label className="flex items-start gap-2"><input type="radio" name={`acc-${id}`} checked={want === "public"} onChange={() => setWant("public")} className="mt-1" />
              <span><b>Public link</b><span className="block text-xs text-[var(--mute)]">Anyone with the link can view it. Search engines are asked to skip it.</span></span></label>
            <label className="flex items-start gap-2"><input type="radio" name={`acc-${id}`} checked={want === "password"} onChange={() => setWant("password")} className="mt-1" />
              <span><b>Password</b><span className="block text-xs text-[var(--mute)]">Visitors see nothing until they enter it. One password for everyone you share it with.</span></span></label>
            <label className="flex items-start gap-2 opacity-60"><input type="radio" disabled className="mt-1" />
              <span><b>Specific people by email</b> <span className="rounded-full bg-[var(--bg)] px-2 py-0.5 text-xs">coming later</span><span className="block text-xs text-[var(--mute)]">Choose exactly who can open it, each with their own sign-in. No shared password.</span></span></label>
          </fieldset>

          {want === "password" && (
            <form onSubmit={(e) => { e.preventDefault(); void save("password"); }} className="space-y-2">
              <label className="block text-xs font-medium">{protectedNow ? "New password (replaces the current one)" : "Choose a password"}
                <div className="mt-1 flex flex-wrap gap-2">
                  <input name="new-password" type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} maxLength={128} required autoComplete="new-password" className={`${field} max-w-xs`} />
                  <button type="button" onClick={() => { setPw(generate()); setShow(true); }} className={btn}>Generate one</button>
                  <button type="button" onClick={() => setShow((v) => !v)} className={btn}>{show ? "Hide" : "Show"}</button>
                </div>
              </label>
              <p className="text-xs text-[var(--mute)]">At least 8 characters. <b>We never keep the password, so we cannot show it again.</b> Your browser can save it for you when you press Save, or copy it to your password manager. If it is lost, set a new one here.</p>
              <button disabled={busy || pw.length < 8} className={primary}>{busy ? "Saving..." : protectedNow ? "Change password" : "Turn on password"}</button>
            </form>
          )}

          {want === "public" && protectedNow && (
            <button type="button" onClick={() => save("public")} disabled={busy} className={btn}>{busy ? "Saving..." : "Remove the password (make public)"}</button>
          )}
          {want === "public" && !protectedNow && <p className="text-xs text-[var(--mute)]">This report is public now.</p>}
          {want === "password" && protectedNow && <p className="text-xs text-[var(--ok)]">Password protected now.</p>}
        </>
      )}

      {saved?.mode === "password" && (
        <div role="status" className="rounded-lg border border-[var(--brand-green)] bg-[var(--accent-tint)] p-3">
          <p className="font-semibold">Password saved. Anyone who had the old one is signed out.</p>
          <p className="mt-1 text-xs text-[var(--slate)]">Copy it now, it is not shown again.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={() => copy(saved.pw ?? "", "pw")} className={btn}>{copied === "pw" ? "Copied" : "Copy password"}</button>
            <button type="button" onClick={() => copy(`${shareUrl}\nPassword: ${saved.pw}`, "both")} className={btn}>{copied === "both" ? "Copied" : "Copy link and password"}</button>
          </div>
        </div>
      )}
      {saved?.mode === "public" && <p role="status" className="text-xs text-[var(--ok)]">Saved. This report is public.</p>}
      {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
    </section>
  );
}
