import { FREE } from "./plans";
import { parseWorkbook } from "./parse";
import { encrypt, UserError, type Payload, type ReportData } from "./report";
import { publicView } from "./visibility";

export type Built = { title: string; subtitle: string; payload: Payload; protectedByPassword: boolean; sheetCount: number; rowCount: number };

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
  if (password && password.length < 6) throw new UserError("Passwords need at least 6 characters.");
  const parsed = await parseWorkbook(Buffer.from(await file.arrayBuffer()));
  const sheets = parsed.sheets;
  // The workbook is the master: a Title / Subtitle in its Settings sheet wins over the form fields.
  title = parsed.title || title;
  subtitle = parsed.subtitle || subtitle;
  if (!title) throw new UserError("Give the report a title (or add a Title row to a Settings sheet).");
  const data: ReportData = { title, subtitle, generated: new Date().toISOString().slice(0, 10), sheets, ...(parsed.brand ? { brand: parsed.brand } : {}) };
  // A password report keeps only the public view: its data is encrypted with the password, which we never store,
  // so we could not filter it later. Anything marked private or hide is not kept.
  const payload: Payload = password ? { enc: await encrypt(JSON.stringify(publicView(data)), password) } : { data };
  return {
    title, subtitle, payload,
    protectedByPassword: !!password,
    sheetCount: sheets.length,
    rowCount: sheets.reduce((n, s) => n + s.rows.length, 0),
  };
}
