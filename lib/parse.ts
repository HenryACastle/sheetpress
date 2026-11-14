import readXlsxFile, { readSheetNames } from "read-excel-file/node";
import { FREE } from "./plans";
import { UserError, type Sheet } from "./report";

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

export async function parseWorkbook(buf: Buffer): Promise<Sheet[]> {
  let names: string[];
  try {
    names = await readSheetNames(buf);
  } catch {
    throw new UserError("That file could not be read as an .xlsx workbook.");
  }
  if (names.length > FREE.maxSheets) throw new UserError(`Free reports can have up to ${FREE.maxSheets} sheets.`);
  const sheets: Sheet[] = [];
  for (const name of names) {
    const raw = await readXlsxFile(buf, { sheet: name });
    const rows = raw.map((r) => r.map(cell));
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
    sheets.push({
      name,
      kind: /^(summary|overview|kpis?|dashboard)$/i.test(name) ? "summary" : "table",
      headers: headers.map((h, i) => String(h || `Column ${i + 1}`)),
      rows: data,
    });
  }
  if (!sheets.length) throw new UserError("The workbook has no data.");
  return sheets;
}

