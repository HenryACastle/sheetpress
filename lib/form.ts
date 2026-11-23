import { FREE } from "./plans";
import { parseWorkbook } from "./parse";
import { newPasswordAccess } from "./access";
import { UserError, type Access, type Payload, type ReportData } from "./report";

export type Built = { title: string; subtitle: string; payload: Payload; protectedByPassword: boolean; sheetCount: number; rowCount: number; access?: Access };

// Turns the upload form into a stored payload. `file` is optional only when `requireFile` is false.
export async function buildFromForm(form: FormData, requireFile: boolean): Promise<Built | null> {
  const file = form.get("file");
  let title = String(form.get("title") ?? "").trim().slice(0, 80);
  let subtitle = String(form.get("subtitle") ?? "").trim().slice(0, 160);
  const password = String(form.get("password") ?? "");
  if (!(file instanceof File) || file.size === 0) {
    if (!title) throw new UserError("Give the report a title.");
    if (requireFile) throw new UserError("Choose an .xlsx file.");
    return null;
  }
  if (file.size > FREE.maxFileBytes) throw new UserError("File is too large. Free reports are limited to 2 MB.");
  if (!/\.xlsx$/i.test(file.name)) throw new UserError("Only .xlsx files are supported right now.");
  const parsed = await parseWorkbook(Buffer.from(await file.arrayBuffer()));
  const sheets = parsed.sheets;
  // The workbook is the master: a Title / Subtitle in its Settings sheet wins over the form fields.
  title = parsed.title || title;
  subtitle = parsed.subtitle || subtitle;
  if (!title) throw new UserError("Give the report a title (or add a Title row to a Settings sheet).");
  const data: ReportData = { title, subtitle, generated: new Date().toISOString().slice(0, 10), sheets, ...(parsed.brand ? { brand: parsed.brand } : {}) };
  // Access is separate from the workbook. A password given here (new reports, or an old-style protected one being
  // replaced) is stored as a hash and checked on the server; everything else is public until set in the Access panel.
  const access: Access | undefined = password ? newPasswordAccess(password) : undefined;
  const payload: Payload = { data, ...(access ? { access } : {}) };
  return {
    title, subtitle, payload, access,
    protectedByPassword: !!access,
    sheetCount: sheets.length,
    rowCount: sheets.reduce((n, s) => n + s.rows.length, 0),
  };
}
