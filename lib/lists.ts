import { FREE } from "./plans";
import { UserError, type Sheet } from "./report";

const cellOk = (v: unknown): v is string | number => typeof v === "string" || (typeof v === "number" && Number.isFinite(v));

/** Checks sheets posted from the dashboard editor against the same limits as an upload. Never trusts the client. */
export function validateSheets(input: unknown): Sheet[] {
  if (!Array.isArray(input) || !input.length || input.length > FREE.maxSheets) throw new UserError("Nothing to save.");
  return input.map((raw, si) => {
    const s = raw as Partial<Sheet>;
    const name = String(s?.name ?? "").trim().slice(0, 60);
    if (!name) throw new UserError(`Sheet ${si + 1} needs a name.`);
    if (!Array.isArray(s.headers) || !s.headers.length || s.headers.length > FREE.maxColumns) throw new UserError(`"${name}" has too many columns.`);
    const headers = s.headers.map((h, i) => String(h ?? "").trim().slice(0, 60) || `Column ${i + 1}`);
    if (!Array.isArray(s.rows) || s.rows.length > FREE.maxRowsPerSheet) throw new UserError(`"${name}" is limited to ${FREE.maxRowsPerSheet} rows.`);
    const rows = s.rows.map((r) => {
      if (!Array.isArray(r)) throw new UserError("Bad row.");
      return headers.map((_, i) => { const v = r[i]; return cellOk(v) ? (typeof v === "string" ? v.slice(0, 500) : v) : ""; });
    });
    const kind: Sheet["kind"] = s.kind === "summary" || s.kind === "chart" ? s.kind : "table";
    return { name, kind, headers, rows };
  });
}
