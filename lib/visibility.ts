import type { ReportData, Sheet } from "./report";

// SHOW CODES decide what the public page may see. Enforced on the server, so hidden data is never sent.
//
//   Row:    a column named Show (or Public, Visible, "On site"). yes / y / true / 1 / show / public => shown.
//           no / n / false / 0 / hide / hidden / private => hidden. Blank => shown. The column itself is never shown.
//   Column: header ends with [private] or [hide]  => hidden from the public page. [public] (or nothing) => shown.
//   Sheet:  sheet name ends with (private) or (hide) => the whole sheet is hidden. (Excel does not allow square
//           brackets in a sheet name, so round brackets work everywhere; both work on headers.)
//
// The owner still sees and edits everything in the dashboard and in the .xlsx download.

const HIDE_CODE = /\s*[[(](private|hide|hidden)[\])]\s*$/i;
const ANY_CODE = /\s*[[(](private|hide|hidden|public|show)[\])]\s*$/i;
const SHOW_HEADER = /^(show|public|visible|on site|show on site)$/i;
const NO = /^(no|n|false|0|hide|hidden|private|off)$/i;

export const isHiddenName = (n: string) => HIDE_CODE.test(n);
export const cleanName = (n: string) => n.replace(ANY_CODE, "").trim();
export const isShowColumn = (h: string) => SHOW_HEADER.test(cleanName(h));
export const rowIsHidden = (v: unknown) => NO.test(String(v ?? "").trim());

export function publicSheet(sheet: Sheet): Sheet | null {
  if (isHiddenName(sheet.name)) return null;
  const showCol = sheet.headers.findIndex(isShowColumn);
  const keep = sheet.headers.map((h, i) => i !== showCol && !isHiddenName(h));
  const rows = sheet.rows
    .filter((r) => showCol < 0 || !rowIsHidden(r[showCol]))
    .map((r) => r.filter((_, i) => keep[i]));
  const headers = sheet.headers.filter((_, i) => keep[i]).map(cleanName);
  // A sheet whose every column is hidden has nothing to show.
  if (!headers.length) return null;
  return { ...sheet, name: cleanName(sheet.name), headers, rows };
}

/** What a visitor may see. Pure: the stored data is not changed. */
export function publicView(d: ReportData): ReportData {
  const sheets = d.sheets.map(publicSheet).filter((s): s is Sheet => s !== null);
  return { ...d, sheets, editable: undefined };
}

/** How much a view hides, for the owner's "Hidden from the public" note. */
export function hiddenCounts(d: ReportData) {
  let sheets = 0, columns = 0, rows = 0;
  for (const s of d.sheets) {
    if (isHiddenName(s.name)) { sheets++; continue; }
    const showCol = s.headers.findIndex(isShowColumn);
    columns += s.headers.filter((h, i) => i !== showCol && isHiddenName(h)).length;
    if (showCol >= 0) rows += s.rows.filter((r) => rowIsHidden(r[showCol])).length;
  }
  return { sheets, columns, rows };
}
