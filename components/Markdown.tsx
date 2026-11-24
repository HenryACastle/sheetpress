import Link from "next/link";
import type { ReactNode } from "react";

// A tiny, safe Markdown renderer for our own guide: headings, paragraphs, lists, tables, bold, `code`, links.
// No HTML is ever injected; everything is built as React elements.
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0, i = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0], k = `${key}-${i++}`;
    if (t.startsWith("**")) out.push(<strong key={k}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={k} className="rounded bg-[var(--card)] px-1.5 py-0.5 font-mono text-[0.9em] border border-[var(--line)]">{t.slice(1, -1)}</code>);
    else {
      const [, label, href] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(t)!;
      out.push(href.startsWith("/") ? <Link key={k} href={href}>{label}</Link> : <a key={k} href={href} target="_blank" rel="noopener noreferrer">{label}</a>);
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export function headings(md: string) { return md.split("\n").filter((l) => /^## /.test(l)).map((l) => l.slice(3).trim()); }

export default function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r/g, "").split("\n");
  const out: ReactNode[] = [];
  let i = 0, k = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { i++; continue; }
    let m: RegExpExecArray | null;
    if ((m = /^(#{1,3}) (.*)$/.exec(l))) {
      const lvl = m[1].length, id = slugify(m[2]);
      const cls = lvl === 1 ? "mb-3 text-3xl font-bold tracking-tight" : lvl === 2 ? "mb-2 mt-12 scroll-mt-24 text-2xl font-semibold tracking-tight" : "mb-1 mt-7 scroll-mt-24 text-lg font-semibold";
      const Tag = (`h${lvl}`) as "h1" | "h2" | "h3";
      out.push(<Tag key={k++} id={id} className={cls}>{inline(m[2], `h${k}`)}</Tag>); i++; continue;
    }
    if (l.trim().startsWith("|")) {
      const head = cells(l); i += 2; // skip the --- row
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(cells(lines[i++]));
      out.push(
        <div key={k++} className="my-4 overflow-x-auto rounded-lg border border-[var(--line)]">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead><tr>{head.map((h, c) => <th key={c} className="border-b border-[var(--line)] bg-[var(--card)] px-3 py-2 text-left font-semibold">{inline(h, `th${c}`)}</th>)}</tr></thead>
            <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} className="border-b border-[var(--line)] px-3 py-2 align-top last:border-b-0">{inline(c, `td${ri}-${ci}`)}</td>)}</tr>)}</tbody>
          </table>
        </div>);
      continue;
    }
    if (/^(\d+\.|-) /.test(l)) {
      const ordered = /^\d+\./.test(l), items: string[] = [];
      while (i < lines.length && /^(\d+\.|-) /.test(lines[i])) items.push(lines[i++].replace(/^(\d+\.|-) /, ""));
      const Tag = ordered ? "ol" : "ul";
      out.push(<Tag key={k++} className={`my-3 space-y-1.5 pl-6 ${ordered ? "list-decimal" : "list-disc"}`}>{items.map((t, n) => <li key={n}>{inline(t, `li${n}`)}</li>)}</Tag>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,3} |\||(\d+\.|-) )/.test(lines[i])) para.push(lines[i++]);
    out.push(<p key={k++} className="my-3">{inline(para.join(" "), `p${k}`)}</p>);
  }
  return <>{out}</>;
}
