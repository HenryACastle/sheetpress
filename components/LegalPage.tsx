import Link from "next/link";
import Logo from "./Logo";
import { SUPPORT_EMAIL } from "@/lib/site";

export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <>
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Logo />
        <Link href="/" className="text-sm text-[var(--mute)] hover:text-[var(--ink)]">Back to home</Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-6">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-[var(--mute)]">Last updated {updated}</p>
        <div className="mt-8 space-y-6 text-[15px] leading-relaxed [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_a]:text-[var(--accent)] [&_a]:underline">
          {children}
          {SUPPORT_EMAIL && (<><h2>Contact</h2><p>Questions or requests: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p></>)}
        </div>
      </main>
    </>
  );
}
