import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import SiteHeader from "@/components/landing/SiteHeader";
import Markdown, { headings, slugify } from "@/components/Markdown";

export const metadata: Metadata = {
  alternates: { canonical: "/docs" },
  title: "Guide: how to format your workbook | SheetPress",
  description: "How to set up an Excel workbook for SheetPress: sheets, tables, charts, the page builder with config codes, branding and privacy.",
};
export const dynamic = "force-static";

export default function Docs() {
  // One source of truth: docs/GUIDE.md in the repo.
  const md = readFileSync(join(process.cwd(), "docs", "GUIDE.md"), "utf8");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 lg:grid lg:grid-cols-[200px_1fr] lg:gap-10">
        <nav aria-label="On this page" className="mb-8 text-sm lg:sticky lg:top-24 lg:mb-0 lg:self-start">
          <p className="mb-2 font-semibold">On this page</p>
          <ul className="space-y-1.5 text-[var(--mute)]">
            {headings(md).map((h) => <li key={h}><a href={`#${slugify(h)}`} className="hover:text-[var(--ink)]">{h}</a></li>)}
          </ul>
        </nav>
        <article className="min-w-0 text-[15px] leading-relaxed [&_a]:text-[var(--accent)] [&_a]:underline">
          <Markdown source={md} />
          <p className="mt-12 text-sm text-[var(--mute)]">Ready to try it? <Link href="/sign-up">Start free</Link>.</p>
        </article>
      </main>
    </>
  );
}
