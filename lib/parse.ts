import readXlsxFile, { readSheetNames } from "read-excel-file/node";
import { FREE } from "./plans";
import { UserError, type Brand, type Sheet } from "./report";

function cell(v: unknown): string | number {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") return Math.round(v * 1e6) / 1e6;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "object") {
    const o = v as { text?: unknown; value?: unknown };
    return String(o.text ?? o.value ?? "");
  }
  return String(v);
}

// How a sheet is shown, decided by its NAME (see WorkbookTips):
//   Summary, Overview, KPIs, Dashboard, or a name starting "KPI "   -> headline tiles (label, value, note)
//   a name starting "Chart "  (e.g. "Chart Network daily")          -> line graph + the table underneath
//   Settings (not shown as a tab)                                    -> logo, accent colour, theme, title...
//   anything else                                                    -> searchable, sortable table
const KPI_NAME = /^(summary|overview|kpis?|dashboard)$|^kpis?[\s:_-]/i;
const CHART_NAME = /^chart[\s:_-]+/i;
const SETTINGS_NAME = /^(settings|setup|report settings|branding)$/i;

// Show codes ride on names and headers: "Cost [private]" hides that column from the public page,
// "Notes [hide]" the same, "Plan (private)" as a SHEET name hides the whole sheet (Excel forbids [ ] in sheet names).
// See lib/visibility.ts.
const CODE = /\s*[[(](private|hide|hidden|public|show)[\])]\s*$/i;
const stripCode = (n: string) => n.replace(CODE, "").trim();

export function sheetKind(name: string): Sheet["kind"] {
  const n = stripCode(name);
  if (CHART_NAME.test(n)) return "chart";
  return KPI_NAME.test(n) ? "summary" : "table";
}
// Keeps a trailing show code (it is the owner's setting) but drops the Chart/KPI prefix.
export const displayName = (name: string) => {
  const code = (name.match(CODE)?.[0] ?? "").trim();
  const base = stripCode(name).replace(CHART_NAME, "").replace(/^kpis?[\s:_-]+(?=.)/i, "").trim() || stripCode(name);
  return code ? `${base} ${code}` : base;
};

const httpsUrl = (v: unknown) => { const s = String(v ?? "").trim(); return /^https:\/\/[^\s"'<>]{4,300}$/i.test(s) ? s : undefined; };

/** Settings sheet: two columns, Setting | Value. Unknown or invalid values are ignored, never an error. */
export function parseSettings(rows: (string | number)[][]): { brand?: Brand; title?: string; subtitle?: string } {
  const kv: Record<string, string> = {};
  for (const r of rows) { const k = String(r[0] ?? "").trim().toLowerCase(); if (k) kv[k] = String(r[1] ?? "").trim(); }
  const brand: Brand = {};
  const logo = httpsUrl(kv["logo"] ?? kv["logo url"]); if (logo) brand.logo = logo;
  const link = httpsUrl(kv["logo link"] ?? kv["link"] ?? kv["website"]); if (link) brand.link = link;
  const accent = (kv["accent"] ?? kv["accent color"] ?? kv["accent colour"] ?? kv["color"] ?? "").replace(/^([0-9a-f]{6})$/i, "#$1");
  if (/^#[0-9a-f]{6}$/i.test(accent)) brand.accent = accent.toLowerCase();
  const theme = (kv["theme"] ?? "").toLowerCase(); if (theme === "light" || theme === "dark") brand.theme = theme;
  const footer = (kv["footer"] ?? "").slice(0, 140); if (footer) brand.footer = footer;
  const cur = (kv["currency"] ?? kv["currency symbol"] ?? "").slice(0, 3); if (cur && !/[<>&"'\s]/.test(cur)) brand.currency = cur;
  return { brand: Object.keys(brand).length ? brand : undefined, title: kv["title"]?.slice(0, 80) || undefined, subtitle: kv["subtitle"]?.slice(0, 160) || undefined };
}

export type Parsed = { sheets: Sheet[]; brand?: Brand; title?: string; subtitle?: string };

export async function parseWorkbook(buf: Buffer): Promise<Parsed> {
  let names: string[];
  try {
    names = await readSheetNames(buf);
  } catch {
    throw new UserError("That file could not be read as an .xlsx workbook.");
  }
  if (names.length > FREE.maxSheets + 1) throw new UserError(`Free reports can have up to ${FREE.maxSheets} sheets.`);
  const sheets: Sheet[] = [];
  let settings: ReturnType<typeof parseSettings> = {};
  for (const name of names) {
    const raw = await readXlsxFile(buf, { sheet: name });
    const rows = raw.map((r) => r.map(cell));
    if (SETTINGS_NAME.test(name)) { settings = parseSettings(rows); continue; }
    while (rows.length && rows[rows.length - 1].every((c) => c === "")) rows.pop();
    if (!rows.length) continue;
    const width = Math.max(...rows.map((r) => r.length));
    const norm = rows.map((r) => Object.assign(new Array(width).fill(""), r) as (string | number)[]);
    const keep = [...Array(width).keys()].filter((c) => norm.some((r) => r[c] !== ""));
    if (keep.length > FREE.maxColumns) throw new UserError(`Sheet "${name}" has more than ${FREE.maxColumns} columns.`);
    const trimmed = norm.map((r) => keep.map((c) => r[c]));
    const [headers, ...body] = trimmed;
    const data = body.filter((r) => r.some((c) => c !== ""));
    if (data.length > FREE.maxRowsPerSheet) {
      throw new UserError(`Sheet "${name}" has ${data.length} rows. Free reports are limited to ${FREE.maxRowsPerSheet} per sheet.`);
    }
    const kind = sheetKind(name);
    sheets.push({
      name: displayName(name),
      kind,
      headers: headers.map((h, i) => String(h || `Column ${i + 1}`)),
      rows: data,
    });
  }
  if (!sheets.length) throw new UserError("The workbook has no data.");
  if (sheets.length > FREE.maxSheets) throw new UserError(`Free reports can have up to ${FREE.maxSheets} sheets.`);
  return { sheets, ...settings };
}
