import type { Block, Sheet } from "./report";

// PAGE BUILDER. A sheet named Page / Layout / Home / Site / Builder, whose first header is Block (or Type, Element),
// becomes a web page. One row per element, top to bottom:
//
//   Block    Content                          Options (the config code: key=value; key=value)
//   heading  Welcome to our site              level=1; align=center
//   text     A few lines about us.            size=lg; muted=yes
//   kpi      KPIs                             cols=3
//   chart    Chart Daily                      title=Traffic
//   table    Pages                            limit=10; columns=Page,Clicks
//
// Parsing is done on the server (publicView), so the browser only ever gets validated blocks.
// Sheets named in Content are looked up in the browser against what the visitor may see, so a private sheet
// can never leak through a block.

export const BLOCK_TYPES = ["heading", "text", "image", "button", "kpi", "stat", "table", "chart", "list", "callout", "divider", "spacer", "config"] as const;
const ALIAS: Record<string, string> = {
  title: "heading", h1: "heading", h2: "heading", h3: "heading", header: "heading",
  paragraph: "text", p: "text", copy: "text",
  img: "image", picture: "image", photo: "image", logo: "image",
  link: "button", cta: "button",
  kpis: "kpi", tiles: "kpi", stats: "kpi", metrics: "kpi",
  metric: "stat", tile: "stat", number: "stat",
  grid: "table", data: "table",
  graph: "chart", "line chart": "chart",
  bullets: "list", checklist: "list", items: "list",
  note: "callout", alert: "callout", banner: "callout", quote: "callout",
  line: "divider", hr: "divider", rule: "divider",
  space: "spacer", gap: "spacer",
  page: "config", settings: "config", defaults: "config",
};
export const MAX_BLOCKS = 200;
const MAX_TEXT = 2000;

export const PAGE_NAME = /^(page|layout|home|site|builder)(?:[\s:_-]+(.+))?$/i;
const BLOCK_HEADER = /^(block|blocks|type|element|elements)$/i;
const CONTENT_HEADER = /^(content|text|source|value|data)$/i;
const OPTIONS_HEADER = /^(options|config|format|style|settings|code)$/i;

/** Is this sheet a page layout? Name AND first header must match, so a normal "Home" data sheet stays a table. */
export function isPageSheet(name: string, headers: string[]): boolean {
  return PAGE_NAME.test(name.replace(/\s*[[(](private|hide|hidden|public|show)[\])]\s*$/i, "").trim()) && BLOCK_HEADER.test(String(headers[0] ?? "").trim());
}
/** Tab label: "Page About" -> "About"; plain "Page", "Layout", "Site", "Builder" -> "Home". */
export function pageTabName(name: string): string {
  const m = PAGE_NAME.exec(name.trim());
  return (m?.[2] ?? "").trim() || "Home";
}

const WIDTHS: Record<string, string> = { full: "100", half: "50", third: "33.33", quarter: "25", "two-thirds": "66.66", "three-quarters": "75", "2/3": "66.66", "1/2": "50", "1/3": "33.33", "1/4": "25", "3/4": "75" };
const COLORS = ["accent", "ink", "mute", "ok", "bad", "warn", "prog"];
const yes = (v: string) => /^(yes|y|true|1|on)$/i.test(v);
const num = (v: string, lo: number, hi: number) => { const n = parseFloat(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : undefined; };
const https = (v: string) => (/^https:\/\/[^\s"'<>]{4,300}$/i.test(v) ? v : undefined);
const oneOf = (v: string, list: string[]) => (list.includes(v.toLowerCase()) ? v.toLowerCase() : undefined);

/** "key=value; key=value" (also "key: value", also newlines). Keys are lower-case; later keys win. */
export function parseOptions(code: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of String(code ?? "").slice(0, 600).split(/[;\n]+/)) {
    const m = /^\s*([a-z][a-z0-9 _-]*?)\s*[=:]\s*(.*?)\s*$/i.exec(part);
    if (m) out[m[1].toLowerCase().replace(/[\s_-]+/g, "")] = m[2];
  }
  return out;
}

function clean(type: string, o: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  const set = (k: string, v: string | undefined) => { if (v !== undefined && v !== "") out[k] = v; };
  // options every block understands
  if (o.width) { const w = WIDTHS[o.width.toLowerCase()] ?? (/^\d{2,3}%$/.test(o.width) ? String(Math.min(100, Math.max(10, parseInt(o.width)))) : undefined); set("width", w); }
  set("align", oneOf(o.align ?? "", ["left", "center", "right"]));
  if (o.color) { const c = o.color.toLowerCase(); set("color", COLORS.includes(c) || /^#[0-9a-f]{6}$/.test(c) ? c : undefined); }
  if (o.card) set("card", yes(o.card) ? "yes" : "no");
  set("pad", oneOf(o.pad ?? "", ["none", "sm", "md", "lg"]));
  if (o.hide && yes(o.hide)) set("hide", "yes");
  switch (type) {
    case "heading": set("level", String(num(o.level ?? "", 1, 3) ?? 2)); break;
    case "text": set("size", oneOf(o.size ?? "", ["sm", "md", "lg", "xl"])); if (o.muted) set("muted", yes(o.muted) ? "yes" : "no"); break;
    case "image": set("alt", (o.alt ?? "").slice(0, 160)); set("link", https(o.link ?? "")); set("height", String(num(o.height ?? "", 40, 900) ?? "") || undefined); set("fit", oneOf(o.fit ?? "", ["cover", "contain"])); if (o.round) set("round", yes(o.round) ? "yes" : "no"); break;
    case "button": set("link", https(o.link ?? "")); set("tab", (o.tab ?? "").slice(0, 60)); set("style", oneOf(o.style ?? "", ["solid", "outline"])); break;
    case "kpi": set("cols", String(num(o.cols ?? o.columns ?? "", 1, 6) ?? "") || undefined); set("limit", String(num(o.limit ?? "", 1, 60) ?? "") || undefined); break;
    case "stat": set("value", (o.value ?? "").slice(0, 40)); set("note", (o.note ?? "").slice(0, 120)); break;
    case "table": set("limit", String(num(o.limit ?? "", 1, 500) ?? "") || undefined); set("columns", (o.columns ?? "").slice(0, 300)); if (o.search) set("search", yes(o.search) ? "yes" : "no"); set("title", (o.title ?? "").slice(0, 100)); break;
    case "chart": set("title", (o.title ?? "").slice(0, 100)); if (o.table) set("table", yes(o.table) ? "yes" : "no"); break;
    case "list": set("style", oneOf(o.style ?? "", ["bullet", "number", "check"])); break;
    case "callout": set("tone", oneOf(o.tone ?? o.type ?? "", ["info", "success", "warn", "bad"])); set("title", (o.title ?? "").slice(0, 100)); break;
    case "divider": break;
    case "spacer": set("height", String(num(o.height ?? "", 4, 200) ?? "") || undefined); break;
    case "config": set("maxwidth", String(num(o.maxwidth ?? "", 480, 1600) ?? "") || undefined); set("gap", String(num(o.gap ?? "", 0, 48) ?? "") || undefined); set("tabs", oneOf(o.tabs ?? o.navigation ?? "", ["show", "hide", "on", "off"])); break;
  }
  return out;
}

/** Rows of a page sheet -> validated blocks. Unknown block types and bad values are skipped, never an error. */
export function parseBlocks(headers: string[], rows: (string | number)[][]): Block[] {
  const bi = Math.max(0, headers.findIndex((h) => BLOCK_HEADER.test(h.trim())));
  const ci = headers.findIndex((h, i) => i !== bi && CONTENT_HEADER.test(h.trim()));
  const oi = headers.findIndex((h, i) => i !== bi && i !== ci && OPTIONS_HEADER.test(h.trim()));
  const cIdx = ci >= 0 ? ci : bi + 1, oIdx = oi >= 0 ? oi : bi + 2;
  const blocks: Block[] = [];
  for (const r of rows) {
    const raw = String(r[bi] ?? "").trim().toLowerCase();
    if (!raw) continue;
    const m = /^(h([123]))$/.exec(raw);
    const type = (m ? "heading" : ALIAS[raw] ?? raw) as Block["type"];
    if (!(BLOCK_TYPES as readonly string[]).includes(type)) continue;
    const opts = clean(type, parseOptions(r[oIdx]));
    if (m && !opts.level) opts.level = m[2];
    if (opts.hide === "yes") continue;
    const content = String(r[cIdx] ?? "").slice(0, MAX_TEXT).trim();
    if (type === "image") { const src = https(content); if (!src) continue; blocks.push({ type, text: src, opts }); }
    else if (type === "divider" || type === "spacer" || type === "config") blocks.push({ type, text: "", opts });
    else if (content || type === "stat") blocks.push({ type, text: content, opts });
    if (blocks.length >= MAX_BLOCKS) break;
  }
  return blocks;
}

/** A page sheet as visitors get it: blocks only, the raw rows are not sent. */
export function pageForVisitor(s: Sheet): Sheet {
  return { ...s, kind: "page", headers: [], rows: [], blocks: parseBlocks(s.headers, s.rows) };
}
