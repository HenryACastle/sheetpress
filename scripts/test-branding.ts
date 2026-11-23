process.env.ACCESS_COOKIE_SECRET = "brand-test-secret";
import assert from "node:assert/strict";
import { newPasswordAccess } from "../lib/access";
import { accentReadable, effectiveBrand, sanitizeBranding, validLogo } from "../lib/branding";
import { handleView, type Row } from "../lib/report-routes";
import type { ReportData } from "../lib/report";

let n = 0; const t = (name: string, fn: () => void | Promise<void>) => Promise.resolve(fn()).then(() => { n++; console.log("PASS ", name); });
const bad = (f: () => unknown) => assert.throws(f, /./);
const data: ReportData = { title: "R", subtitle: "", generated: "2026-11-23", brand: { accent: "#111111", footer: "From workbook" }, sheets: [{ name: "Plan", kind: "table", headers: ["A"], rows: [["x"]] }] };
const ID = "aaaaaaaa-1111-4222-8333-444455556666";
let payload: unknown = { data };
const lookup = async (): Promise<Row | null> => ({ id: ID, title: "R", payload });
const view = async () => (await handleView(new Request("https://sheetpress.org/r/rep"), "rep", lookup)).text();

(async () => {
  await t("logo: https or small image data only", () => {
    assert.ok(validLogo("https://a.com/l.png")); assert.ok(validLogo("data:image/png;base64,iVBORw0KGgo="));
    for (const v of ["http://a.com/l.png", "javascript:alert(1)", "data:text/html;base64,AAAA", "data:image/svg+xml;utf8,<svg onload=1>", "https://a.com/\"onerror=x"]) assert.equal(validLogo(v), undefined, v);
    assert.equal(validLogo("data:image/png;base64," + "A".repeat(160_000)), undefined);
  });
  await t("sanitize: good values kept, empty clears, bad throws", () => {
    assert.deepEqual(sanitizeBranding({ accent: "2A7F63", theme: "DARK", footer: "  hi  ", hideBadge: true }), { accent: "#2a7f63", theme: "dark", footer: "hi", hideBadge: true });
    assert.deepEqual(sanitizeBranding({ accent: "", logo: null, footer: "  " }), {});
    bad(() => sanitizeBranding({ accent: "red" })); bad(() => sanitizeBranding({ theme: "blue" })); bad(() => sanitizeBranding({ logo: "http://x" })); bad(() => sanitizeBranding({ link: "javascript:1" })); bad(() => sanitizeBranding({ currency: "<b>" }));
    assert.equal(sanitizeBranding({ footer: "x".repeat(500) }).footer?.length, 140);
  });
  await t("dashboard branding wins over workbook, merging the rest", () => {
    assert.deepEqual(effectiveBrand({ accent: "#111111", footer: "wb" }, { accent: "#222222" }), { accent: "#222222", footer: "wb" });
    assert.equal(effectiveBrand(undefined, undefined), undefined);
  });
  await t("contrast warning", () => { assert.equal(accentReadable("#16242b", "dark"), false); assert.equal(accentReadable("#ffe19f", "dark"), true); });
  await t("view: workbook brand applies, dashboard override replaces it, badge flag passes through", async () => {
    let b = await view(); assert.ok(b.includes("From workbook")); assert.ok(b.includes("#111111"));
    payload = { data, branding: { accent: "#abcdef", footer: "Dash footer", hideBadge: true } };
    b = await view(); assert.ok(b.includes("Dash footer") && b.includes("#abcdef") && b.includes('"hideBadge":true'));
    assert.ok(!b.includes("From workbook"));
  });
  await t("lock page honours hideBadge and a data: logo", async () => {
    payload = { data, access: newPasswordAccess("opensesame123"), branding: { hideBadge: true, logo: "data:image/png;base64,iVBORw0KGgo=" } };
    let b = await view(); assert.ok(!b.includes("Built with")); assert.ok(b.includes("data:image/png"));
    payload = { data, access: newPasswordAccess("opensesame123") };
    b = await view(); assert.ok(b.includes("Built with"));
  });
  console.log(`branding: ${n} checks passed`);
})();
