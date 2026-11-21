import { FREE } from "@/lib/plans";

const steps = [
  ["Get a workbook", "Use your own .xlsx, or start from a sample below."],
  ["Publish it", "Give it a title, choose the file, and add a password if it should be private."],
  ["Share the link", "Copy the link from your reports list. Update it any time by uploading a new file."],
];

// First-run guide. Shown for a brand-new account (arrived via sign-up) or while there are no reports yet.
export default function WelcomeGuide({ greeting }: { greeting: boolean }) {
  return (
    <section className="rounded-xl border border-[var(--brand-green)] bg-[var(--accent-tint)] p-5 sm:p-6" aria-labelledby="welcome-title">
      <h1 id="welcome-title" className="text-xl font-bold">{greeting ? "Welcome to SheetPress" : "Publish your first report"}</h1>
      <p className="mt-1 text-sm text-[var(--slate)]">Your free plan includes {FREE.maxReports} reports. Here is the quickest way to your first one.</p>
      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        {steps.map(([t, d], i) => (
          <li key={t} className="rounded-lg bg-[var(--card)] p-4">
            <span className="mb-2 grid h-7 w-7 place-items-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">{i + 1}</span>
            <p className="font-semibold">{t}</p>
            <p className="mt-1 text-sm text-[var(--mute)]">{d}</p>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="font-semibold">No workbook handy?</span>
        <a href="/examples/q4-site-rollout.xlsx" download className="text-[var(--accent)] underline underline-offset-2">Download a status report sample</a>
        <a href="/examples/team-directory.xlsx" download className="text-[var(--accent)] underline underline-offset-2">Download a directory sample</a>
        <a href="/r/demo-q4-site-rollout" target="_blank" rel="noopener" className="text-[var(--accent)] underline underline-offset-2">See what it becomes</a>
      </div>
    </section>
  );
}
