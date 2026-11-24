import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isPageSheet, pageTabName, parseBlocks, parseOptions } from "../lib/blocks";
import { parseWorkbook } from "../lib/parse";
import { publicView } from "../lib/visibility";
import type { ReportData } from "../lib/report";

let n = 0; const t = async (name: string, fn: () => void | Promise<void>) => { await fn(); n++; console.log("PASS ", name); };
const H = ["Block", "Content", "Options"];

(async () => {
  await t("options: key=value; also key: value, case/spaces forgiven, later wins", () => {
    assert.deepEqual(parseOptions("Width = half; align:center;\nmax width=900; width=third"), { width: "third", align: "center", maxwidth: "900" });
    assert.deepEqual(parseOptions(undefined), {});
  });
  await t("page sheet needs the name AND a Block header; tab names", () => {
    assert.ok(isPageSheet("Page", H)); assert.ok(isPageSheet("Home", ["Type", "Content"])); assert.ok(isPageSheet("Page About (private)", H));
    assert.ok(!isPageSheet("Home", ["Item", "Qty"])); assert.ok(!isPageSheet("Menu", H));
    assert.equal(pageTabName("Page"), "Home"); assert.equal(pageTabName("Page About"), "About"); assert.equal(pageTabName("Layout"), "Home");
  });
  await t("blocks: types, aliases, h2, option cleaning", () => {
    const b = parseBlocks(H, [
      ["h2", "Hi", ""], ["Title", "Big", "level=1; color=#ABCDEF; align=middle"], ["paragraph", "Text", "size=xl; width=50%"],
      ["kpis", "KPIs", "cols=99"], ["image", "http://insecure.com/a.png", ""], ["image", "https://a.com/a.png", "link=javascript:alert(1); height=5000"],
      ["button", "Go", "link=https://x.com; style=outline"], ["nonsense", "x", ""], ["", "orphan", ""], ["text", "", ""], ["divider", "", ""],
      ["text", "hidden", "hide=yes"], ["callout", "Careful", "tone=warn"],
    ]);
    assert.deepEqual(b.map((x) => x.type), ["heading", "heading", "text", "kpi", "image", "button", "divider", "callout"]);
    assert.equal(b[0].opts.level, "2"); assert.equal(b[1].opts.level, "1"); assert.equal(b[1].opts.color, "#abcdef"); assert.equal(b[1].opts.align, undefined);
    assert.equal(b[2].opts.width, "50"); assert.equal(b[3].opts.cols, "6");
    assert.equal(b[4].opts.link, undefined); assert.equal(b[4].opts.height, "900");
  });
  await t("blocks: columns can be in any order and be named Type/Text/Config", () => {
    const b = parseBlocks(["Config", "Type", "Text"], [["align=center", "heading", "Reordered"]]);
    assert.equal(b[0].text, "Reordered"); assert.equal(b[0].opts.align, "center");
  });
  await t("limits: 200 blocks max", () => {
    assert.equal(parseBlocks(H, Array.from({ length: 300 }, () => ["text", "x", ""])).length, 200);
  });
  await t("example workbook parses into a page and visitors get blocks, not rows", async () => {
    const p = await parseWorkbook(readFileSync("public/examples/page-builder.xlsx"));
    assert.equal(p.sheets[0].kind, "page"); assert.equal(p.sheets[0].name, "Home");
    const d: ReportData = { title: "t", subtitle: "", generated: "2026-11-24", sheets: p.sheets, brand: p.brand };
    const v = publicView(d); const page = v.sheets[0];
    assert.equal(page.kind, "page"); assert.equal(page.rows.length, 0); assert.ok((page.blocks?.length ?? 0) > 10);
    assert.ok(page.blocks!.some((x) => x.type === "chart" && x.text === "Chart Visits"));
    const menu = v.sheets.find((s) => s.name === "Menu")!; assert.ok(!JSON.stringify(menu).includes("Secret test recipe")); // show codes still apply to block sources
  });
  await t("a private sheet is gone from what visitors get, so a block pointing at it has nothing to show", async () => {
    const d: ReportData = { title: "t", subtitle: "", generated: "x", sheets: [
      { name: "Home", kind: "page", headers: H, rows: [["table", "Budget", ""]] },
      { name: "Budget (private)", kind: "table", headers: ["A"], rows: [["TOPSECRET"]] }] };
    assert.ok(!JSON.stringify(publicView(d)).includes("TOPSECRET"));
  });
  console.log(`blocks: ${n} checks passed`);
})().catch((e) => { console.error(e); process.exit(1); });
