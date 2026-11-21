"use client";

import { useEffect, useState } from "react";
import { SUPPORT_EMAIL } from "@/lib/site";

// Clerk draws the sign-in / sign-up form from a script served by its own domain. If that script cannot
// load (DNS for the Clerk domain missing, a blocker, an outage) the form area stays silently blank,
// which looks like a broken site. After a few seconds without a ready Clerk, say so instead.
export default function AuthLoadGuard({ children }: { children: React.ReactNode }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ready = () => Boolean((window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded);
    if (ready()) return;
    const poll = window.setInterval(() => { if (ready()) { window.clearInterval(poll); window.clearTimeout(stop); setFailed(false); } }, 300);
    const stop = window.setTimeout(() => { window.clearInterval(poll); if (!ready()) setFailed(true); }, 8000);
    return () => { window.clearInterval(poll); window.clearTimeout(stop); };
  }, []);

  return (
    <>
      {children}
      {failed && (
        <div role="alert" className="w-full rounded-lg border border-[var(--line)] bg-white p-5 text-sm text-[var(--ink)]">
          <p className="font-semibold">The sign-in form did not load.</p>
          <p className="mt-1 text-[var(--mute)]">
            Refresh the page. If it is still blank, an ad or tracking blocker may be stopping it, or the sign-in service is
            having a problem. {SUPPORT_EMAIL ? <>Email <a className="underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we will sort it out.</> : "Please try again in a few minutes."}
          </p>
        </div>
      )}
    </>
  );
}
