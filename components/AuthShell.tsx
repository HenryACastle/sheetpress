import Link from "next/link";
import Logo from "./Logo";
import AuthLoadGuard from "./AuthLoadGuard";

const points = [
  ["Upload an .xlsx, get a live page", "From spreadsheet to a shareable link in under a minute."],
  ["Password protection is free", "Lock any report with a password. We never store the password itself."],
  ["Update in place", "Upload a new workbook and the same link shows the new numbers."],
];

// Shared frame for /sign-in and /sign-up. Left: why SheetPress (hidden on phones). Right: the Clerk form.
export default function AuthShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-[var(--ink)] p-10 text-white lg:flex">
        <div className="[&_a]:text-white"><Logo /></div>
        <div>
          <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight">Turn any Excel sheet into a website, a report or an app.</h2>
          <ul className="mt-8 space-y-5">
            {points.map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-[var(--brand-green)] text-[var(--ink)]" aria-hidden>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6.5l2.5 2.5 4.5-5.5" /></svg>
                </span>
                <span><span className="block font-semibold">{t}</span><span className="block text-sm text-white/70">{d}</span></span>
              </li>
            ))}
          </ul>
          <a href="/r/demo-q4-site-rollout" target="_blank" rel="noopener" className="mt-8 inline-block text-sm font-semibold text-[var(--brand-green)] underline underline-offset-4">See a live example</a>
        </div>
        <p className="text-sm text-white/50">Free plan: 3 reports. No credit card.</p>
      </aside>

      <main className="flex flex-col items-center justify-center gap-5 px-4 py-10">
        <div className="lg:hidden"><Logo /></div>
        <div className="flex w-full max-w-[26rem] flex-col items-center gap-4"><AuthLoadGuard>{children}</AuthLoadGuard></div>
        {footer && <div className="max-w-[26rem] text-center text-xs text-[var(--mute)]">{footer}</div>}
        <Link href="/" className="text-sm text-[var(--mute)] hover:text-[var(--ink)]">&larr; Back to home</Link>
      </main>
    </div>
  );
}
