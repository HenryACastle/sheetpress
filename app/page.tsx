import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import Logo from "@/components/Logo";
import { FREE } from "@/lib/plans";

const features = [
  ["Status at a glance", "Columns like Done / In progress / Blocked become colored chips with a clickable breakdown bar."],
  ["KPI tiles", "Name a sheet Summary and its rows turn into headline numbers at the top of the report."],
  ["Search and sort", "Every table is searchable and sortable, on desktop and phone."],
  ["Password protection", "Add a password and the data is encrypted. Without it, the page contains nothing readable."],
  ["Update in place", "Upload a new workbook and the same link shows the new numbers."],
  ["No code", "No dashboards to design. Your spreadsheet is the source of truth."],
];

export default async function Home() {
  const { userId } = await auth();
  const cta = userId ? { href: "/app", label: "Open dashboard" } : { href: "/sign-up", label: "Start free" };
  return (
    <>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <nav className="flex items-center gap-4 text-sm">
          {!userId && <Link href="/sign-in" className="text-[var(--mute)] hover:text-[var(--ink)]">Sign in</Link>}
          <Link href={cta.href} className="rounded-lg bg-[var(--accent)] px-3.5 py-2 font-semibold text-white">{cta.label}</Link>
        </nav>
      </header>
      <main>
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-14 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Turn an Excel file into a report your team can open from a link.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--mute)]">Upload an .xlsx. Get a clean, searchable progress report with status chips, KPI tiles and optional password protection. Update it by uploading again.</p>
          <div className="mt-8"><Link href={cta.href} className="inline-block rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-white">{cta.label}</Link></div>
          <p className="mt-3 text-sm text-[var(--mute)]">Free: {FREE.maxReports} reports. No credit card.</p>
        </section>
        <section className="mx-auto grid max-w-5xl gap-4 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([t, d]) => (
            <div key={t} className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-5">
              <h3 className="font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-[var(--mute)]">{d}</p>
            </div>
          ))}
        </section>
        <section className="mx-auto max-w-3xl px-4 pb-20">
          <h2 className="mb-4 text-center text-2xl font-bold">Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-5">
              <h3 className="font-semibold">Free</h3>
              <ul className="mt-2 space-y-1 text-sm text-[var(--mute)]">
                <li>{FREE.maxReports} reports</li><li>Up to {FREE.maxRowsPerSheet} rows per sheet</li>
                <li>Password protection</li><li>sheetpress.yeve.dev/r/your-report</li><li>&ldquo;Built with Sheetpress&rdquo; footer</li>
              </ul>
            </div>
            <div className="rounded-xl border border-dashed border-[var(--line)] p-5">
              <h3 className="font-semibold">Pro <span className="ml-1 rounded bg-[var(--line)] px-1.5 py-0.5 text-xs font-medium">coming soon</span></h3>
              <ul className="mt-2 space-y-1 text-sm text-[var(--mute)]">
                <li>Your own domain</li><li>Live Google Sheets sync</li><li>Team logins to view reports</li><li>More reports, bigger files, no footer</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[var(--line)] py-6 text-center text-sm text-[var(--mute)]">&copy; {new Date().getFullYear()} Sheetpress</footer>
    </>
  );
}
