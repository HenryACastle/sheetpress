"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// Google tag (Tag Manager container GTM-XXXX, or a GA4 Measurement ID G-XXXX). Public marketing pages only
// (mounted in app/(site)/layout.tsx). Consent modes (see lib/site.ts CONSENT_MODE):
//   regional (default): on by default outside the EU/EEA, UK and Switzerland; opt-in banner inside them or when the
//                       country is unknown (fail safe).
//   none:               on by default for everyone.
//   optin:              off until the visitor accepts.
// In every mode: a Global Privacy Control / Do Not Track signal keeps it off, an explicit choice is remembered for
// 12 months (localStorage), "Cookie settings" lets people change it, Google's advertising consent is always denied,
// and withdrawing deletes Google's cookies and reloads the page so nothing keeps running.
const KEY = "sheetpress_consent_v1";
const TTL_MS = 365 * 24 * 60 * 60 * 1000;
export const OPEN_EVENT = "sheetpress:cookie-settings";

type Mode = "regional" | "none" | "optin";
type Gtag = (...args: unknown[]) => void;
type Win = Window & { dataLayer?: unknown[]; gtag?: Gtag; [k: `ga-disable-${string}`]: boolean | undefined };
const W = () => window as unknown as Win;

function readChoice(): "granted" | "denied" | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as { a?: string; t?: number } | null;
    if (!v || (v.a !== "granted" && v.a !== "denied") || typeof v.t !== "number" || Date.now() - v.t > TTL_MS) return null;
    return v.a;
  } catch { return null; }
}
function saveChoice(a: "granted" | "denied") { try { localStorage.setItem(KEY, JSON.stringify({ a, t: Date.now() })); } catch { /* private mode: the choice lasts for this page only */ } }

function privacySignal(): boolean {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string };
  return n.globalPrivacyControl === true || n.doNotTrack === "1" || n.msDoNotTrack === "1";
}

const push = (o: Record<string, unknown>) => { const w = W(); (w.dataLayer = w.dataLayer || []).push(o); };

function loadGoogle(id: string) {
  const w = W();
  if (w.gtag) { w.gtag("consent", "update", { analytics_storage: "granted" }); return; } // already loaded on this page
  w.dataLayer = w.dataLayer || [];
  w.gtag = function () { (w.dataLayer as unknown[]).push(arguments); }; // Google's tags read the `arguments` object, not an array
  // Consent defaults must be set BEFORE the Google tag loads (Google's documented order).
  w.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "granted" });
  const s = document.createElement("script");
  s.async = true;
  if (id.startsWith("GTM-")) {
    // Tag Manager's own start sequence (what its official snippet does): without gtm.start the container's triggers do not fire.
    push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    s.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`;
  } else {
    w[`ga-disable-${id}`] = false;
    w.gtag("js", new Date());
    w.gtag("config", id, { allow_google_signals: false, allow_ad_personalization_signals: false });
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  }
  document.head.appendChild(s);
}

function stopGoogle(id: string) {
  const w = W();
  w[`ga-disable-${id}`] = true; // Google's documented opt-out switch (applies to a G- measurement ID)
  w.gtag?.("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  const host = location.hostname, parts = host.split("."), parent = parts.length > 2 ? parts.slice(-2).join(".") : host;
  for (const c of document.cookie.split(";")) {
    const name = c.split("=")[0].trim();
    if (!/^(_ga|_gid|_gcl|_gat)/.test(name)) continue;
    for (const domain of [undefined, host, `.${host}`, `.${parent}`]) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ""}`;
    }
  }
}

export default function GoogleAnalytics({ id, mode }: { id: string; mode: Mode }) {
  const [dialog, setDialog] = useState<null | "ask" | "manage">(null);
  const [signal, setSignal] = useState(false);
  const [active, setActive] = useState(false); // is Google running on this page right now?
  const activeRef = useRef(false);

  const start = useCallback(() => { loadGoogle(id); activeRef.current = true; setActive(true); }, [id]);

  const decide = useCallback((a: "granted" | "denied") => {
    saveChoice(a); setDialog(null);
    if (a === "granted") { start(); return; }
    stopGoogle(id);
    setActive(false);
    if (activeRef.current) setTimeout(() => location.reload(), 50); // Google was running on this page: start clean without it
  }, [id, start]);

  useEffect(() => {
    let cancelled = false;
    const sig = privacySignal();
    setSignal(sig);
    const stored = readChoice();
    const onOpen = () => setDialog(activeRef.current ? "manage" : "ask");
    window.addEventListener(OPEN_EVENT, onOpen);

    (async () => {
      if (stored === "granted") { start(); return; }
      if (stored === "denied" || sig) return; // an explicit "no" or a privacy signal is respected without nagging
      if (mode === "optin") { setDialog("ask"); return; }
      if (mode === "none") { start(); return; }
      // regional: ask the server whether this visitor's country needs a prior opt-in; unknown or failed => ask (fail safe)
      let optin = true;
      try {
        const r = await fetch("/api/geo", { cache: "no-store" });
        if (r.ok) optin = (await r.json()).optin !== false;
      } catch { /* keep optin = true */ }
      if (cancelled) return;
      if (optin) setDialog("ask"); else start();
    })();

    return () => { cancelled = true; window.removeEventListener(OPEN_EVENT, onOpen); };
  }, [mode, start]);

  // Measures intent only: which pages lead to a click on "Start free". Sign-ups themselves are counted in Clerk.
  useEffect(() => {
    if (!active) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || new URL(a.href, location.href).pathname !== "/sign-up") return;
      const detail = { link_text: (a.textContent ?? "").trim().slice(0, 40), page_path: location.pathname };
      // gtag-style event: a Google tag inside a Tag Manager container picks it up on its own (no trigger to build),
      // and it is also usable as a Custom Event trigger in Tag Manager. Do not also push a plain object: it would count twice.
      W().gtag?.("event", "start_free_click", detail);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [active]);

  if (!dialog) return null;
  const btn = "rounded-lg px-4 py-2 text-sm font-semibold";
  const primary = `${btn} bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]`;
  const secondary = `${btn} border border-[var(--line)] bg-white hover:bg-[var(--bg)]`;
  return (
    <div role="dialog" aria-label="Cookie preferences" aria-live="polite" className="fixed inset-x-3 bottom-3 z-50 rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-lg sm:right-auto sm:max-w-md">
      {dialog === "ask" ? (
        <>
          <p className="text-sm font-semibold">Can we count visits with Google Analytics?</p>
          <p className="mt-1 text-sm text-[var(--mute)]">
            It sets two cookies and shows us which guides help people. Nothing loads from Google unless you accept. It is never used on reports or in your account.{" "}
            <Link href="/privacy" className="underline">Privacy policy</Link>
          </p>
          {signal && <p className="mt-1 text-xs text-[var(--mute)]">Your browser sends a privacy signal, so analytics stays off unless you choose Accept.</p>}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => decide("granted")} className={primary}>Accept analytics</button>
            <button type="button" onClick={() => decide("denied")} className={secondary}>Decline</button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm font-semibold">Analytics is on</p>
          <p className="mt-1 text-sm text-[var(--mute)]">
            We count visits to our public pages with Google Analytics, which sets two cookies. You can turn it off at any time. It is never used on reports or in your account.{" "}
            <Link href="/privacy" className="underline">Privacy policy</Link>
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => decide("denied")} className={primary}>Turn off analytics</button>
            <button type="button" onClick={() => decide("granted")} className={secondary}>Keep it on</button>
          </div>
        </>
      )}
    </div>
  );
}
