import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/landing/SiteHeader";
import JsonLd from "@/components/blog/JsonLd";
import PostCard from "@/components/blog/PostCard";
import Markdown, { headings, slugify } from "@/components/Markdown";
import { formatDate, getAllPosts, getPost, relatedPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";
export const dynamicParams = false; // unknown slugs are a real 404, not a soft page

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const url = `/blog/${post.slug}`;
  return {
    title: { absolute: post.title }, // already written to fit a search result, no brand suffix needed
    description: post.description,
    alternates: { canonical: url },
    openGraph: { type: "article", title: post.title, description: post.description, url, publishedTime: post.date, modifiedTime: post.updated ?? post.date, tags: post.tags, siteName: "SheetPress" },
    twitter: { card: "summary_large_image", title: post.title, description: post.description },
  };
}

export default async function PostPage({ params }: Props) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const toc = headings(post.body);
  const related = relatedPosts(post, 3);
  const url = `${SITE_URL}/blog/${post.slug}`;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--mute)]">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-[var(--ink)]">Home</Link></li><li aria-hidden>/</li>
            <li><Link href="/blog" className="hover:text-[var(--ink)]">Blog</Link></li><li aria-hidden>/</li>
            <li aria-current="page" className="truncate">{post.title}</li>
          </ol>
        </nav>
        <div className="lg:grid lg:grid-cols-[1fr_200px] lg:gap-12">
          <article className="min-w-0 text-[16px] leading-relaxed [&_a]:text-[var(--accent)] [&_a]:underline">
            <header className="mb-8">
              <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
              <p className="mt-3 text-sm text-[var(--mute)]">
                By SheetPress · <time dateTime={post.date}>{formatDate(post.date)}</time>
                {post.updated && post.updated !== post.date && <> · Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time></>} · {post.minutes} min read
              </p>
            </header>
            <Markdown source={post.body} />
            <aside className="mt-12 rounded-xl border border-[var(--brand-green)] bg-[var(--accent-tint)] p-6" aria-label="Try SheetPress">
              <p className="text-lg font-semibold">Turn your Excel file into a page people can open from a link.</p>
              <p className="mt-1 text-sm text-[var(--slate)]">Free for 3 reports, no credit card. Add a password if it should stay private.</p>
              <p className="mt-4 flex flex-wrap gap-3 no-underline">
                <Link href="/sign-up" className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold !text-white !no-underline hover:bg-[var(--accent-hover)]">Start free</Link>
                <Link href="/r/demo-q4-site-rollout" className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold !text-[var(--ink)] !no-underline hover:bg-[var(--bg)]">See a live example</Link>
              </p>
            </aside>
          </article>
          {toc.length > 1 && (
            <nav aria-label="On this page" className="order-first mb-8 text-sm lg:order-none lg:sticky lg:top-24 lg:mb-0 lg:self-start">
              <p className="mb-2 font-semibold">On this page</p>
              <ul className="space-y-1.5 text-[var(--mute)]">
                {toc.map((h) => <li key={h}><a href={`#${slugify(h)}`} className="hover:text-[var(--ink)]">{h}</a></li>)}
              </ul>
            </nav>
          )}
        </div>
        {related.length > 0 && (
          <section className="mt-16" aria-labelledby="keep-reading">
            <h2 id="keep-reading" className="mb-4 text-xl font-semibold">Keep reading</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.map((p) => <PostCard key={p.slug} post={p} />)}</div>
          </section>
        )}
      </main>
      <JsonLd data={[
        {
          "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.description,
          datePublished: post.date, dateModified: post.updated ?? post.date, url, mainEntityOfPage: { "@type": "WebPage", "@id": url },
          keywords: post.tags.join(", "), wordCount: post.words, inLanguage: "en",
          author: { "@type": "Organization", name: "SheetPress", url: SITE_URL },
          publisher: { "@type": "Organization", name: "SheetPress", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } },
        },
        {
          "@context": "https://schema.org", "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
            { "@type": "ListItem", position: 3, name: post.title, item: url },
          ],
        },
      ]} />
    </>
  );
}
