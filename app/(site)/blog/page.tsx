import type { Metadata } from "next";
import SiteHeader from "@/components/landing/SiteHeader";
import JsonLd from "@/components/blog/JsonLd";
import PostCard from "@/components/blog/PostCard";
import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "SheetPress Blog: Excel to website guides and comparisons",
  description: "Practical guides on turning Excel files into websites and reports, sharing spreadsheets safely, and choosing the right spreadsheet-to-web tool.",
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/blog/rss.xml" } },
  openGraph: { title: "SheetPress Blog", description: "Guides on turning Excel files into websites and reports.", url: "/blog", type: "website" },
};

export default function BlogIndex() {
  const posts = getAllPosts();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-10">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">The SheetPress blog</h1>
          <p className="mt-3 text-[var(--mute)]">Guides for turning Excel files into websites and reports, sharing spreadsheets without the attachment mess, and picking the right spreadsheet-to-web tool.</p>
        </header>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {posts.map((p) => <PostCard key={p.slug} post={p} />)}
        </div>
        {posts.length === 0 && <p className="mt-10 text-[var(--mute)]">First posts are on the way.</p>}
      </main>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "Blog", name: "SheetPress Blog", url: `${SITE_URL}/blog`,
        publisher: { "@type": "Organization", name: "SheetPress", url: SITE_URL },
        blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE_URL}/blog/${p.slug}`, datePublished: p.date })),
      }} />
    </>
  );
}
