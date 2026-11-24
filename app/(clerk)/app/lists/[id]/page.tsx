import { auth } from "@clerk/nextjs/server";
import AccountMenu from "@/components/AccountMenu";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ListEditor from "@/components/ListEditor";
import Logo from "@/components/Logo";
import { getOwned } from "@/lib/reports";
import type { Payload } from "@/lib/report";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit list | SheetPress", robots: { index: false } };

export default async function EditList({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const row = await getOwned(id, userId);
  if (!row) notFound();
  const payload = row.payload as Payload;
  if (!("data" in payload) || !payload.data.editable) redirect("/app");
  return (
    <>
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Logo /><AccountMenu />
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-20">
        <Link href="/app" className="text-sm text-[var(--mute)] hover:text-[var(--ink)]">&larr; All reports</Link>
        <ListEditor id={row.id} slug={row.slug} title={row.title} sheets={payload.data.sheets} />
      </main>
    </>
  );
}
