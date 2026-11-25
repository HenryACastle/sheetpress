import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Blog posts are Markdown files in content/blog/<slug>.md with a small frontmatter block:
//
//   ---
//   title: ...            (max 60 chars: it is the <title> tag, shown as-is in search results)
//   description: ...      (70 to 160 chars: the search snippet and the share text)
//   date: 2026-11-25      (publish date, YYYY-MM-DD)
//   updated: 2026-12-01   (optional, last meaningful edit)
//   keyword: ...          (the one search phrase this post targets; must appear in title, description and intro)
//   tags: [excel, how-to] (1 to 4)
//   ---
//
// The body uses only what components/Markdown.tsx renders: ## and ### headings (no # heading, the page
// supplies the h1), paragraphs, lists, tables, **bold**, `code` and [links](...). Rules are enforced here so a
// broken post fails the build instead of shipping. scripts/test-blog.ts adds link and content checks.

export type Post = {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  keyword: string;
  tags: string[];
  body: string;
  words: number;
  minutes: number;
};

const DIR = join(process.cwd(), "content", "blog");
const ISO = /^\d{4}-\d{2}-\d{2}$/;

function parseFrontmatter(raw: string, file: string): { meta: Record<string, string>; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw.replace(/\r/g, ""));
  if (!m) throw new Error(`${file}: missing frontmatter block`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const kv = /^([a-z]+):\s*(.*)$/.exec(line);
    if (!kv) throw new Error(`${file}: cannot read frontmatter line "${line}"`);
    meta[kv[1]] = kv[2].trim().replace(/^"(.*)"$/, "$1");
  }
  return { meta, body: m[2].trim() };
}

export function parsePost(raw: string, file: string): Post {
  const slug = file.replace(/\.md$/, "");
  const { meta, body } = parseFrontmatter(raw, file);
  const fail = (msg: string): never => { throw new Error(`${file}: ${msg}`); };
  for (const key of ["title", "description", "date", "keyword", "tags"]) if (!meta[key]) fail(`frontmatter "${key}" is required`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail("file name must be a lower-case slug like my-post.md");
  if (meta.title.length > 60) fail(`title is ${meta.title.length} chars, the limit is 60`);
  if (meta.description.length < 70 || meta.description.length > 160) fail(`description is ${meta.description.length} chars, it must be 70 to 160`);
  if (!ISO.test(meta.date) || Number.isNaN(Date.parse(meta.date))) fail("date must be YYYY-MM-DD");
  if (meta.updated && (!ISO.test(meta.updated) || meta.updated < meta.date)) fail("updated must be YYYY-MM-DD and not before date");
  const tags = meta.tags.replace(/^\[|\]$/g, "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (tags.length < 1 || tags.length > 4) fail("use 1 to 4 tags");
  if (/^# /m.test(body)) fail("do not put a # heading in the body, the page renders the title as the h1");
  const words = body.replace(/[#|*`\[\]()>-]/g, " ").split(/\s+/).filter(Boolean).length;
  return { slug, title: meta.title, description: meta.description, date: meta.date, updated: meta.updated, keyword: meta.keyword, tags, body, words, minutes: Math.max(1, Math.round(words / 220)) };
}

let cache: Post[] | null = null;
export function getAllPosts(): Post[] {
  if (cache && process.env.NODE_ENV === "production") return cache;
  let files: string[] = [];
  try { files = readdirSync(DIR).filter((f) => f.endsWith(".md")); } catch { /* no posts yet */ }
  const posts = files.map((f) => parsePost(readFileSync(join(DIR, f), "utf8"), f));
  const seen = new Set<string>();
  for (const p of posts) {
    if (seen.has(p.title.toLowerCase())) throw new Error(`duplicate post title: ${p.title}`);
    seen.add(p.title.toLowerCase());
  }
  cache = posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.slug.localeCompare(b.slug)));
  return cache;
}

export const getPost = (slug: string) => getAllPosts().find((p) => p.slug === slug) ?? null;

// Related = most shared tags, then newest. Used for the "keep reading" block (internal links help rankings).
export function relatedPosts(post: Post, n = 3): Post[] {
  return getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ p, shared: p.tags.filter((t) => post.tags.includes(t)).length }))
    .sort((a, b) => b.shared - a.shared || (a.p.date < b.p.date ? 1 : -1))
    .slice(0, n)
    .map((x) => x.p);
}

export const formatDate = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
