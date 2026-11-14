import { FREE } from "./plans";
import { parseWorkbook } from "./parse";
import { encrypt, UserError, type Payload, type ReportData } from "./report";

export type Built = { title: string; subtitle: string; payload: Payload; protectedByPassword: boolean; sheetCount: number; rowCount: number };

// Turns the upload form into a stored payload. `file` is optional only when `requireFile` is false.
export async function buildFromForm(form: FormData, requireFile: boolean): Promise<Built | null> {
  const file = form.get("file");
  const title = String(form.get("title") ?? "").trim().slice(0, 80);
  const subtitle = String(form.get("subtitle") ?? "").trim().slice(0, 160);
  const password = String(form.get("password") ?? "");
  if (!title) throw new UserError("Give the report a title.");
  if (!(file instanceof File) || file.size === 0) {
    if (requireFile) throw new UserError("Choose an .xlsx file.");
    return null;
  }
  if (file.size > FREE.maxFileBytes) throw new UserError("File is too large. Free reports are limited to 2 MB.");
  if (!/\.xlsx$/i.test(file.name)) throw new UserError("Only .xlsx files are supported right now.");
  if (password && password.length < 6) throw new UserError("Passwords need at least 6 characters.");
  const sheets = await parseWorkbook(Buffer.from(await file.arrayBuffer()));
  const data: ReportData = { title, subtitle, generated: new Date().toISOString().slice(0, 10), sheets };
  const payload: Payload = password ? { enc: await encrypt(JSON.stringify(data), password) } : { data };
  return {
    title, subtitle, payload,
    protectedByPassword: !!password,
    sheetCount: sheets.length,
    rowCount: sheets.reduce((n, s) => n + s.rows.length, 0),
  };
}
