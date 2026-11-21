import assert from "node:assert/strict";
import { hiddenCounts, publicView } from "../lib/visibility";
import { sheetKind, displayName, parseSettings } from "../lib/parse";
import type { ReportData } from "../lib/report";

const d: ReportData = {
  title: "t", subtitle: "", generated: "2026-11-21", editable: true,
  sheets: [
    { name: "Shopping list", kind: "table", headers: ["Item", "Qty", "Cost [private]", "Notes [hide]", "Store [public]", "Show"], rows: [
      ["Milk", 2, 4.5, "organic", "Publix", "yes"],
      ["Gift", 1, 60, "surprise", "Amazon", "no"],
      ["Eggs", 12, 3, "", "Publix", ""],
      ["Wine", 1, 20, "", "ABC", "Private"],
    ] },
    { name: "Budget (private)", kind: "table", headers: ["A"], rows: [["x"]] },
    { name: "Chart Prices (hide)", kind: "chart", headers: ["Date", "N"], rows: [["2026-01-01", 1]] },
    { name: "Only hidden", kind: "table", headers: ["a [private]", "Show"], rows: [["1", "yes"]] },
  ],
};
const v = publicView(d);
assert.deepEqual(v.sheets.map((s) => s.name), ["Shopping list"], "private and all-hidden sheets are removed");
assert.deepEqual(v.sheets[0].headers, ["Item", "Qty", "Store"], "private columns, the Show column and the codes are removed");
assert.deepEqual(v.sheets[0].rows, [["Milk", 2, "Publix"], ["Eggs", 12, "Publix"]], "rows marked no/private are removed; blank means shown");
assert.equal(v.editable, undefined, "the public copy does not advertise editing");
assert.equal(JSON.stringify(v).includes("surprise"), false, "hidden text never appears in the public payload");
assert.equal(JSON.stringify(v).includes("Amazon"), false, "hidden rows never appear");
assert.equal(d.sheets[0].rows.length, 4, "the stored data is not changed");
const h = hiddenCounts(d);
assert.equal(h.sheets, 2, "two hidden sheets by name"); assert.equal(h.rows, 2); assert.ok(h.columns >= 2);
// codes do not break kind detection
assert.equal(sheetKind("Chart Prices (hide)"), "chart"); assert.equal(sheetKind("KPIs (private)"), "summary"); assert.equal(sheetKind("Chart Prices [hide]"), "chart"); assert.equal(sheetKind("Items"), "table");
assert.equal(displayName("Chart Prices (hide)"), "Prices (hide)"); assert.equal(displayName("Chart Daily"), "Daily");
// round brackets work on headers too
assert.deepEqual(publicView({ ...d, sheets: [{ name: "S", kind: "table", headers: ["A", "B (private)"], rows: [["1", "2"]] }] }).sheets[0].headers, ["A"]);
// settings
const s = parseSettings([["Title", "x"], ["Accent", "ffe19f"], ["Theme", "dark"], ["Logo", "http://insecure"], ["Logo", "https://ok.example/l.png"]]);
assert.equal(s.brand?.accent, "#ffe19f"); assert.equal(s.brand?.logo, "https://ok.example/l.png"); assert.equal(s.title, "x");
// a Show column with different header spellings
for (const hd of ["Public", "Visible", "On site", "show", "Show [public]"]) {
  const r = publicView({ ...d, sheets: [{ name: "S", kind: "table", headers: ["A", hd], rows: [["keep", "yes"], ["drop", "no"]] }] });
  assert.deepEqual(r.sheets[0].rows, [["keep"]], `row code via "${hd}"`);
}
console.log("visibility: all checks passed");
