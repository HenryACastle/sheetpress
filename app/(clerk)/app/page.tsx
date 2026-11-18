import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import ReportCard from "@/components/ReportCard";
import ReportForm from "@/components/ReportForm";
import { FREE } from "@/lib/plans";
import { listReports } from "@/lib/reports";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard | SheetPress" };

export default async function Dashboard() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const list = await listReports(userId);
  const full = list.length >= FREE.maxReports;
  return (
    <>
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Logo /><UserButton />
      </header>
      <main className="mx-auto max-w-4xl space-y-8 px-4 pb-20">
        <section className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-5">
          <h1 className="text-xl font-bold">Publish a report</h1>
          <p className="mb-4 mt-1 text-sm text-[var(--mute)]">
            Each sheet becomes a tab. Name a sheet <b>Summary</b> (columns: label, value, note) for KPI tiles. {list.length} of {FREE.maxReports} free reports used.
          </p>
          {full ? <p className="text-sm">You have reached the free limit. Delete a report to publish another.</p> : <ReportForm />}
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold">Your reports</h2>
          {list.length === 0 ? (
            <p className="text-sm text-[var(--mute)]">Nothing published yet.</p>
          ) : (
            <ul className="space-y-3">
              {list.map((r) => <ReportCard key={r.id} r={{ ...r, updatedAt: r.updatedAt.toISOString() }} />)}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
