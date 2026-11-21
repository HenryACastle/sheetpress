import { FREE } from "@/lib/plans";

// Short formatting guide, collapsed by default.
export default function WorkbookTips() {
  return (
    <details className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium">How to set up your workbook</summary>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[var(--mute)]">
        <li>Each sheet becomes a tab. The first row of each sheet is the column headers.</li>
        <li>Name a sheet <b>Summary</b>, <b>Overview</b> or <b>KPIs</b> to turn its rows into headline tiles. Columns: label, value, optional note.</li>
        <li>A column named <b>Status</b> with values like Done, In progress or Blocked becomes colored chips with a filter bar.</li>
        <li>A column with <b>%</b> or <b>Progress</b> in its name becomes a progress bar.</li>
        <li>Full web addresses (https://...) become clickable links.</li>
        <li>Limits: .xlsx up to 2 MB, {FREE.maxSheets} sheets, {FREE.maxRowsPerSheet.toLocaleString()} rows per sheet. Only cell values are imported; formulas show their last saved result.</li>
      </ul>
    </details>
  );
}
