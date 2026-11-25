// Run: npm run test:blog
// Holds every post in content/blog to the SEO and style rules. Fails loudly so a bad post never ships.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getAllPosts } from "../lib/blog";

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra = "") => { cond ? pass++ : fail++; if (!cond || process.env.VERBOSE) console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  " + extra}`); };

const root = process.cwd();
const posts = getAllPosts();
const slugs = new Set(posts.map((p) => p.slug));
const exampleFiles = new Set(readdirSync(join(root, "public", "examples")));
const STATIC_ROUTES = new Set(["/", "/blog", "/docs", "/privacy", "/terms", "/sign-up", "/sign-in", "/r/demo-q4-site-rollout", "/r/demo-team-directory"]);
// Real client, employer or personal names must never appear in product content.
const BANNED = [/barcrawl/i, /groundswell/i, /ignyte/i, /venture ?victory/i, /\bhenry\b/i, /castillo/i, /yeve\.dev/i, /\btodo\b/i, /\bfixme\b/i, /lorem ipsum/i];

ok("at least one post exists", posts.length > 0);

const titles = new Set<string>(), descs = new Set<string>();
for (const p of posts) {
  const tag = `[${p.slug}]`;
  const lower = (s: string) => s.toLowerCase();
  const intro = p.body.split(/\s+/).slice(0, 150).join(" ");

  // --- search basics
  ok(`${tag} keyword in title`, lower(p.title).includes(lower(p.keyword)), `"${p.keyword}" not in "${p.title}"`);
  ok(`${tag} keyword in description`, lower(p.description).includes(lower(p.keyword)), `"${p.keyword}" not in description`);
  ok(`${tag} keyword in the first 150 words`, lower(intro).includes(lower(p.keyword)), `"${p.keyword}" not in intro`);
  ok(`${tag} not thin content (>= 500 words)`, p.words >= 500, `${p.words} words`);
  ok(`${tag} date is not in the future`, p.date <= new Date().toISOString().slice(0, 10), p.date);
  ok(`${tag} title unique`, !titles.has(lower(p.title))); titles.add(lower(p.title));
  ok(`${tag} description unique`, !descs.has(lower(p.description))); descs.add(lower(p.description));

  // --- structure: at least 3 H2s, no skipped levels
  const heads = [...p.body.matchAll(/^(#{2,6}) (.+)$/gm)].map((m) => ({ lvl: m[1].length, text: m[2] }));
  ok(`${tag} has at least 3 sections (##)`, heads.filter((h) => h.lvl === 2).length >= 3, `${heads.filter((h) => h.lvl === 2).length} h2`);
  ok(`${tag} headings do not skip levels, max ###`, heads.every((h, i) => h.lvl <= 3 && (i === 0 ? h.lvl === 2 : h.lvl <= heads[i - 1].lvl + 1)), JSON.stringify(heads.map((h) => h.lvl)));
  ok(`${tag} headings unique (anchor ids)`, new Set(heads.map((h) => h.text.toLowerCase())).size === heads.length);

  // --- style rules
  ok(`${tag} no em or en dashes`, !/[—–]/.test(p.body + p.title + p.description), "found a long dash");
  for (const re of BANNED) ok(`${tag} no banned term ${re}`, !re.test(p.body + p.title + p.description), String(re));

  // --- markdown the renderer cannot show (it would print raw characters)
  const lines = p.body.split("\n");
  ok(`${tag} no unsupported markdown (quotes, images, rules, html, nested lists, italics)`, !lines.some((l) => /^>|^!\[|^-{3,}$|^\s+[-*] |<\/?[a-z][^>]*>/i.test(l)) && !/(^|[^*\w])\*[^*\s][^*]*\*([^*\w]|$)/m.test(p.body.replace(/\*\*[^*]+\*\*/g, "")), "unsupported syntax");
  ok(`${tag} bullet lists use "- " and numbers use "1. "`, !lines.some((l) => /^[*+] |^\d+\) /.test(l)));

  // --- tables: header, separator, equal column counts
  const tableBlocks: string[][] = []; let cur: string[] = [];
  for (const l of lines) { if (l.trim().startsWith("|")) cur.push(l); else if (cur.length) { tableBlocks.push(cur); cur = []; } }
  if (cur.length) tableBlocks.push(cur);
  const cols = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").length;
  ok(`${tag} tables are well formed`, tableBlocks.every((t) => t.length >= 3 && /^\|[\s|:-]+\|$/.test(t[1].trim()) && t.every((r) => cols(r) === cols(t[0]))), "bad table");

  // --- links
  const links = [...p.body.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)].map((m) => ({ text: m[1], href: m[2] }));
  const internal = links.filter((l) => l.href.startsWith("/"));
  const external = links.filter((l) => !l.href.startsWith("/"));
  ok(`${tag} at least 2 internal links`, internal.length >= 2, `${internal.length}`);
  ok(`${tag} links to at least one other post`, internal.some((l) => l.href.startsWith("/blog/")), "no link to another post");
  ok(`${tag} every link has descriptive text`, links.every((l) => l.text.trim().length >= 3 && !/^(click here|here|link)$/i.test(l.text.trim())));
  for (const l of internal) {
    const path = l.href.split("#")[0];
    const good = STATIC_ROUTES.has(path) || (path.startsWith("/blog/") && slugs.has(path.slice(6))) || (path.startsWith("/examples/") && exampleFiles.has(path.slice(10)));
    ok(`${tag} internal link resolves: ${l.href}`, good, "unknown route or file");
    ok(`${tag} does not link to itself: ${l.href}`, path !== `/blog/${p.slug}`);
  }
  for (const l of external) ok(`${tag} external link is https: ${l.href}`, /^https:\/\/[^\s/]+\.[^\s/]+/.test(l.href), "not https");
}

console.log(`\nblog: ${posts.length} posts, ${pass} checks passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
