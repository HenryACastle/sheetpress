import { FREE } from "@/lib/plans";

// Short formatting guide, collapsed by default.
export default function WorkbookTips() {
  return (
    <details className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium">How to set up your workbook</summary>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[var(--mute)]">
        <li>Each sheet becomes a tab. The first row of each sheet is the column headers.</li>
        <li><b>KPI tiles:</b> name a sheet <b>Summary</b>, <b>Overview</b>, <b>KPIs</b> or start it with <b>KPI </b>. Columns: label, value, optional note. Put one number per row.</li>
        <li><b>Line graph:</b> start a sheet name with <b>Chart </b> (for example <b>Chart Network daily</b>). The first column is the horizontal axis (dates work best), every number column becomes a line, and the table shows underneath. A much smaller series (clicks next to impressions) gets its own right-hand axis.</li>
        <li><b>Table:</b> any other sheet name. Searchable and sortable.</li>
        <li><b>Logo, colours and theme:</b> add a sheet named <b>Settings</b> with two columns, Setting and Value. Rows it understands: <b>Title</b>, <b>Subtitle</b>, <b>Logo</b> (an https:// image address), <b>Logo link</b>, <b>Accent</b> (like #ffe19f), <b>Theme</b> (light or dark) and <b>Footer</b>. The Settings sheet is not shown as a tab, and a Title here replaces the title box above.</li>
        <li><b>Show codes (what the public sees):</b> add a <b>Show</b> column with yes or no per row; put <b>[private]</b> after a column header (<b>Price [private]</b>) or <b>(private)</b> after a sheet name (<b>Budget (private)</b>) to hide it. Hidden data is removed before the page is sent. The editable <b>shopping list</b> template has all of this built in.</li>
        <li>A column named <b>Status</b> with values like Done, In progress or Blocked becomes colored chips with a filter bar. A column with <b>Progress</b> or <b>%</b> in its name becomes a progress bar (not rate, CTR or share columns).</li>
        <li>Full web addresses (https://...) become clickable links. Formulas work: SheetPress shows the last result Excel saved, so open and save the file in Excel once after editing.</li>
        <li>Limits: .xlsx up to 2 MB, {FREE.maxSheets} sheets, {FREE.maxRowsPerSheet.toLocaleString()} rows per sheet.</li>
      </ul>
    </details>
  );
}
