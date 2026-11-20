import Link from "next/link";
import Logo from "@/components/Logo";
import ReportPreview from "@/components/landing/ReportPreview";
import { FREE } from "@/lib/plans";
import { SITE_HOST } from "@/lib/site";

// Public page: deliberately independent of Clerk (no provider, no middleware), so it loads
// for everyone, including returning visitors with session cookies and during Clerk outages.
// Rule for this page: only claim what is built. Anything else is labelled "Coming soon".

type UseCase = { title: string; body: string; examples: string; soon?: boolean };
const useCases: UseCase[] = [
  { title: "Reports", body: "Turn a status sheet into a report people actually read. Status columns become colored chips, a Summary sheet becomes headline tiles, percent columns become progress bars.", examples: "Project status, client updates, weekly KPI roll-ups" },
  { title: "Websites", body: "Publish a searchable, sortable table as a page with its own link. Add a password when it should not be public.", examples: "Directories, price lists, menus, catalogs, event lineups" },
  { title: "Dashboards", body: "One link, always current. Re-upload the workbook and everyone sees the new numbers without a new link.", examples: "Team trackers, inventory, pipelines, OKRs" },
  { title: "Client portals", body: "Put a password on any report and send the link. The data is encrypted, so the page holds nothing readable without it.", examples: "Client deliverables, investor updates, internal-only pages" },
  { title: "Schedules and rosters", body: "Shift plans, class timetables and contact lists, searchable on a phone without anyone opening Excel.", examples: "Staff rosters, class schedules, on-call rotas" },
  { title: "Applications", body: "Collect entries with forms, edit rows in the browser and route approvals, with your workbook as the database.", examples: "Intake forms, simple internal tools, approvals", soon: true },
];

const steps = [
  ["Upload your Excel file", "Drop in an .xlsx. Every sheet becomes a tab, and the first row becomes the column headers."],
  ["SheetPress builds the page", "Status, percent and number columns are detected automatically. A sheet named Summary becomes KPI tiles."],
  ["Share the link", "Send it as is, or add a password. Upload a new workbook any time and the same link updates."],
];

const features: [string, string, boolean?][] = [
  ["Excel first", "Start from the .xlsx you already have. No Google account, no sharing settings, no copy and paste."],
  ["Password protection on the free plan", "Many tools lock this behind their top tier. Here the data is encrypted and the password is never stored."],
  ["Reports out of the box", "Status chips, KPI tiles and progress bars appear from your columns. There is no layout to design."],
  ["Search, sort and filter", "Every table is searchable and sortable, and status breakdowns filter the table in one click. Works on a phone."],
  ["Update in place", "Replace the workbook and keep the link, so nothing you already sent goes stale."],
  ["Your own domain", "Serve reports from reports.yourcompany.com.", true],
  ["Live Google Sheets sync", "Connect a sheet and the page refreshes itself.", true],
  ["Team logins", "Choose exactly who can open a report, with no shared password.", true],
];

const faqs: [string, string][] = [
  ["What can I upload?", `An .xlsx file up to 2 MB. The free plan allows up to ${FREE.maxSheets} sheets per workbook and ${FREE.maxRowsPerSheet.toLocaleString()} rows per sheet. Each sheet becomes a tab.`],
  ["Who can see my report?", "Anyone with the link can view a public report, so only publish what you are happy to share. If you add a password, the data is encrypted and the page contains nothing readable without it. Reports are marked noindex, so search engines are asked to skip them."],
  ["Is it free?", `Yes. The free plan includes ${FREE.maxReports} reports and needs no credit card. Paid plans for custom domains and more capacity are coming.`],
  ["How do I update a report?", "Open your dashboard, choose Update and upload the new workbook. The link stays the same."],
  ["Does it work with Google Sheets?", "Not yet. Download your sheet as .xlsx and upload it. Live Google Sheets sync is planned."],
  ["What gets imported from my workbook?", "Cell values only: text, numbers and dates. Formulas show their last calculated value. Formatting, charts and images are not carried over."],
  ["Can I use my own domain?", `Not yet. Reports live at ${SITE_HOST}/r/your-report. Custom domains are planned.`],
  ["Can I turn a spreadsheet into an app?", "That is where SheetPress is heading: forms, in-browser editing and approvals on top of your workbook. Today it publishes websites, reports and dashboards."],
];

const soon = <span className="ml-2 rounded bg-[var(--line)] px-1.5 py-0.5 align-middle text-[11px] font-medium text-[var(--mute)]">Coming soon</span>;
const nav = [["Examples", "#examples"], ["Use cases", "#use-cases"], ["How it works", "#how"], ["Pricing", "#pricing"], ["FAQ", "#faq"]];

const examples = [
  { title: "Status report", blurb: "A 23-site rollout: headline tiles, colored status chips, a breakdown bar and progress bars, all from one workbook.", view: "/r/demo-q4-site-rollout", file: "/examples/q4-site-rollout.xlsx", tag: "Report and dashboard" },
  { title: "Team directory", blurb: "A searchable, sortable staff list with links, published as its own page in seconds.", view: "/r/demo-team-directory", file: "/examples/team-directory.xlsx", tag: "Website and directory" },
];

export default function Home() {
  const cta = "/sign-up";
  return (
    <div>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Logo />
        <nav className="flex items-center gap-5 text-sm" aria-label="Main">
          {nav.map(([l, h]) => <a key={h} href={h} className="hidden text-[var(--mute)] hover:text-[var(--ink)] md:block">{l}</a>)}
          <Link href="/sign-in" className="text-[var(--mute)] hover:text-[var(--ink)]">Sign in</Link>
          <Link href={cta} className="rounded-lg bg-[var(--accent)] px-3.5 py-2 font-semibold text-white hover:bg-[var(--accent-hover)]">Start free</Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 pb-14 pt-12 text-center">
          <span className="mb-5 inline-block rounded-full bg-[var(--accent-tint)] px-3 py-1 text-sm font-medium text-[var(--accent)]">Excel in, live page out</span>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">Turn any Excel sheet into a website, a report or an app.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--mute)]">Upload an .xlsx and get a clean, searchable page with its own link in under a minute. No code, no design work, no Google Sheets setup. Websites and reports today, interactive apps next.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={cta} className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-white hover:bg-[var(--accent-hover)]">Start free</Link>
            <a href="/r/demo-q4-site-rollout" target="_blank" rel="noopener" className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-6 py-3 font-semibold hover:bg-[var(--bg)]">See a live example</a>
          </div>
          <p className="mt-3 text-sm text-[var(--mute)]">Free: {FREE.maxReports} reports, password protection included. No credit card.</p>
          <div className="mt-12"><ReportPreview /></div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-5xl scroll-mt-6 px-4 py-14">
          <h2 className="text-center text-3xl font-bold tracking-tight">From spreadsheet to shareable in three steps</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map(([t, d], i) => (
              <li key={t} className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-5">
                <span className="mb-3 grid h-8 w-8 place-items-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">{i + 1}</span>
                <h3 className="font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-[var(--mute)]">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Live examples */}
        <section id="examples" className="mx-auto max-w-5xl scroll-mt-6 px-4 py-14">
          <h2 className="text-center text-3xl font-bold tracking-tight">See it in action</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--mute)]">Both pages below were built from the Excel files you can download next to them. Fictional data, real output.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {examples.map((e) => (
              <article key={e.title} className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-6">
                <p className="text-xs font-medium text-[var(--accent)]">{e.tag}</p>
                <h3 className="mt-1 text-lg font-semibold">{e.title}</h3>
                <p className="mt-2 text-sm text-[var(--mute)]">{e.blurb}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href={e.view} target="_blank" rel="noopener" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]">View live page</a>
                  <a href={e.file} download className="rounded-lg border border-[var(--line)] px-4 py-2 text-sm font-semibold hover:bg-[var(--bg)]">Download the .xlsx</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Use cases */}
        <section id="use-cases" className="mx-auto max-w-5xl scroll-mt-6 px-4 py-14">
          <h2 className="text-center text-3xl font-bold tracking-tight">Use cases</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--mute)]">If it lives in a spreadsheet today, it can be a page, a report or a tool your team opens from a link.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((u) => (
              <article key={u.title} className={`rounded-xl border p-5 ${u.soon ? "border-dashed border-[var(--line)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
                <h3 className="font-semibold">{u.title}{u.soon && soon}</h3>
                <p className="mt-2 text-sm text-[var(--mute)]">{u.body}</p>
                <p className="mt-3 text-xs text-[var(--slate)]"><span className="font-semibold">Good for: </span>{u.examples}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Features / why */}
        <section id="features" className="mx-auto max-w-5xl scroll-mt-6 px-4 py-14">
          <h2 className="text-center text-3xl font-bold tracking-tight">Built for people who live in Excel</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(([t, d, isSoon]) => (
              <div key={t} className={`rounded-xl border p-5 ${isSoon ? "border-dashed border-[var(--line)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
                <h3 className="font-semibold">{t}{isSoon && soon}</h3>
                <p className="mt-1 text-sm text-[var(--mute)]">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-3xl scroll-mt-6 px-4 py-14">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">Pricing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border-2 border-[var(--accent)] bg-[var(--card)] p-6">
              <h3 className="font-semibold">Free</h3>
              <p className="mt-1 text-3xl font-bold">$0</p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--mute)]">
                <li>{FREE.maxReports} reports</li><li>Up to {FREE.maxRowsPerSheet.toLocaleString()} rows per sheet</li>
                <li>Password protection</li><li>Update in place</li><li>{SITE_HOST}/r/your-report</li><li>&ldquo;Built with SheetPress&rdquo; footer</li>
              </ul>
              <Link href={cta} className="mt-6 block rounded-lg bg-[var(--accent)] px-4 py-2.5 text-center font-semibold text-white hover:bg-[var(--accent-hover)]">Start free</Link>
            </div>
            <div className="rounded-xl border border-dashed border-[var(--line)] p-6">
              <h3 className="font-semibold">Pro {soon}</h3>
              <p className="mt-2 text-xl font-semibold text-[var(--mute)]">Pricing to be announced</p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--mute)]">
                <li>Your own domain</li><li>Live Google Sheets sync</li><li>Team logins to view reports</li><li>More reports and bigger files</li><li>No footer</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-3xl scroll-mt-6 px-4 py-14">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">Questions</h2>
          <div className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-[var(--card)]">
            {faqs.map(([q, a]) => (
              <details key={q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {q}<span aria-hidden className="text-[var(--mute)] transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm text-[var(--mute)]">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-5xl px-4 pb-20 pt-6">
          <div className="rounded-2xl bg-[var(--ink)] px-6 py-12 text-center text-white">
            <h2 className="text-3xl font-bold tracking-tight">Your spreadsheet is already the hard part.</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/75">Publish it as a page your team, clients or customers can open from a link.</p>
            <Link href={cta} className="mt-7 inline-block rounded-lg bg-[var(--brand-green)] px-6 py-3 font-semibold text-[var(--ink)] hover:brightness-110">Start free</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-[var(--mute)]">
          <Logo />
          <nav className="flex flex-wrap gap-5" aria-label="Footer">
            {nav.map(([l, h]) => <a key={h} href={h} className="hover:text-[var(--ink)]">{l}</a>)}
            <Link href="/sign-in" className="hover:text-[var(--ink)]">Sign in</Link>
            <Link href="/privacy" className="hover:text-[var(--ink)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--ink)]">Terms</Link>
          </nav>
          <p>&copy; {new Date().getFullYear()} SheetPress</p>
        </div>
      </footer>
    </div>
  );
}
