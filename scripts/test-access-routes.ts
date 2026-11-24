process.env.ACCESS_COOKIE_SECRET = "route-test-secret";
import assert from "node:assert/strict";
import { newPasswordAccess } from "../lib/access";
import { handleUnlock, handleView, type Row } from "../lib/report-routes";
import type { ReportData } from "../lib/report";

const ID = "aaaaaaaa-1111-4222-8333-444455556666";
const data: ReportData = { title: "Secret report", subtitle: "", generated: "2026-11-23", sheets: [
  { name: "Plan", kind: "table", headers: ["Item", "Price [private]", "Show"], rows: [["Visible thing", 5, "yes"], ["TOPSECRET-ROW", 9, "no"]] },
  { name: "Budget (private)", kind: "table", headers: ["A"], rows: [["TOPSECRET-SHEET"]] },
] };
let access = newPasswordAccess("opensesame123");
let payload: unknown = { data, access };
const lookup = async (slug: string): Promise<Row | null> => (slug === "rep" ? { id: ID, title: "Secret report", payload } : null);
const req = (path: string, init: RequestInit & { headers?: Record<string, string> } = {}) => new Request("https://sheetpress.org" + path, init);
const post = (slug: string, fields: Record<string, string>, headers: Record<string, string> = {}) =>
  handleUnlock(new Request(`https://sheetpress.org/r/${slug}/unlock`, { method: "POST", body: new URLSearchParams(fields), headers: { "x-forwarded-for": "9.9.9.9", ...headers } }), slug, lookup, 0);
let n = 0; const t = async (name: string, fn: () => Promise<void>) => { await fn(); n++; console.log("PASS ", name); };
const cookieFrom = (r: Response) => (r.headers.get("set-cookie") ?? "").split(";")[0];

(async () => {
  await t("unknown or malformed slug is a 404", async () => {
    assert.equal((await handleView(req("/r/nope"), "nope", lookup)).status, 404);
    assert.equal((await handleView(req("/r/BAD_SLUG"), "BAD_SLUG", lookup)).status, 404);
  });
  await t("locked report sends the password page and NO report data", async () => {
    const r = await handleView(req("/r/rep"), "rep", lookup); const body = await r.text();
    assert.equal(r.status, 200); assert.ok(/type="password"/.test(body));
    for (const leak of ["Visible thing", "TOPSECRET", "__DATA__", "Plan"]) assert.ok(!body.includes(leak), "leaked " + leak);
    assert.match(r.headers.get("cache-control") ?? "", /no-store/); assert.match(r.headers.get("x-robots-tag") ?? "", /noindex/);
  });
  await t("a wrong password is refused (401) and sets no cookie", async () => {
    const r = await post("rep", { password: "wrong-password", next: "/r/rep" });
    assert.equal(r.status, 401); assert.equal(r.headers.get("set-cookie"), null); assert.ok((await r.text()).includes("not right"));
  });
  let cookie = "";
  await t("the right password redirects back and sets an HttpOnly Secure cookie", async () => {
    const r = await post("rep", { password: "opensesame123", next: "/r/rep" });
    assert.equal(r.status, 303); assert.equal(r.headers.get("location"), "/r/rep");
    assert.match(r.headers.get("set-cookie") ?? "", /HttpOnly; Secure; SameSite=Lax/); cookie = cookieFrom(r); assert.ok(cookie.length > 40);
  });
  await t("with the cookie the report opens, filtered to the public view, never cached publicly", async () => {
    const r = await handleView(req("/r/rep", { headers: { cookie } }), "rep", lookup); const body = await r.text();
    assert.ok(body.includes("Visible thing")); assert.ok(!body.includes("TOPSECRET-ROW") && !body.includes("TOPSECRET-SHEET"), "private data leaked");
    assert.match(r.headers.get("cache-control") ?? "", /no-store/);
  });
  await t("changing the password signs the old cookie out", async () => {
    access = newPasswordAccess("a-brand-new-pass1", access.mode === "password" ? access.v : 0); payload = { data, access };
    const r = await handleView(req("/r/rep", { headers: { cookie } }), "rep", lookup);
    assert.ok(/type="password"/.test(await r.text()));
    assert.equal((await post("rep", { password: "opensesame123", next: "/r/rep" })).status, 401); // the old password no longer works
    assert.equal((await post("rep", { password: "a-brand-new-pass1", next: "/r/rep" })).status, 303);
  });
  await t("a cookie from one report does not open another", async () => {
    const other: Row = { id: "bbbbbbbb-1111-4222-8333-444455556666", title: "Other", payload: { data, access: newPasswordAccess("other-password-1") } };
    const l2 = async (s: string) => (s === "other" ? other : null);
    const r = await handleView(req("/r/other", { headers: { cookie } }), "other", l2);
    assert.ok(/type="password"/.test(await r.text()));
  });
  await t("open redirect is impossible: next is only / or this report", async () => {
    const r = await post("rep", { password: "a-brand-new-pass1", next: "https://evil.example/x" });
    assert.equal(r.status, 303); assert.equal(r.headers.get("location"), "/r/rep");
    assert.equal((await post("rep", { password: "a-brand-new-pass1", next: "/" })).headers.get("location"), "/");
  });
  await t("custom domain host: the lock page returns the visitor to /", async () => {
    const r = await handleView(req("/r/rep", { headers: { host: "reports.acme.com" } }), "rep", lookup);
    assert.ok((await r.text()).includes('name="next" value="/"'));
  });
  await t("public report: opens without a cookie, hides private data, cacheable", async () => {
    payload = { data, access: { mode: "public" } };
    const r = await handleView(req("/r/rep"), "rep", lookup); const body = await r.text();
    assert.ok(body.includes("Visible thing") && !body.includes("TOPSECRET")); assert.match(r.headers.get("cache-control") ?? "", /s-maxage/);
    assert.equal((await post("rep", { password: "anything", next: "/r/rep" })).status, 303); // nothing to unlock
    payload = { data }; // reports published before access existed are public
    assert.ok((await (await handleView(req("/r/rep"), "rep", lookup)).text()).includes("Visible thing"));
  });
  await t("old browser-encrypted reports still pass through untouched", async () => {
    payload = { enc: { salt: "s", iv: "i", ct: "c", iter: 1 } };
    const r = await handleView(req("/r/rep"), "rep", lookup); assert.equal(r.status, 200); assert.ok((await r.text()).includes('window.__ENC__={"salt":"s"'));
  });
  await t("brute force brake: 8 wrong tries, then 429 even for the right password", async () => {
    payload = { data, access: newPasswordAccess("rightpassword12") };
    for (let i = 0; i < 8; i++) assert.equal((await post("rep", { password: "nope" + i }, { "x-forwarded-for": "7.7.7.7" })).status, 401);
    assert.equal((await post("rep", { password: "rightpassword12" }, { "x-forwarded-for": "7.7.7.7" })).status, 429);
    assert.equal((await post("rep", { password: "rightpassword12" }, { "x-forwarded-for": "8.8.8.8" })).status, 303); // another visitor is not blocked
  });
  await t("a live custom domain is the main address: the SheetPress link forwards there (and only then)", async () => {
    payload = { data };
    const withDomain = (customDomain: string | null, domainVerified: boolean) => async (): Promise<Row | null> => ({ id: ID, title: "Secret report", payload, customDomain, domainVerified });
    let r = await handleView(req("/r/rep"), "rep", withDomain("reports.example.com", true));
    assert.equal(r.status, 307); assert.equal(r.headers.get("location"), "https://reports.example.com/"); assert.match(r.headers.get("cache-control") ?? "", /no-store/);
    assert.equal((await handleView(req("/r/rep"), "rep", withDomain("reports.example.com", false))).status, 200); // not verified yet: no redirect
    assert.equal((await handleView(req("/r/rep"), "rep", withDomain(null, false))).status, 200); // no domain
    const onDomain = new Request("https://reports.example.com/r/rep", { headers: { "x-forwarded-host": "reports.example.com" } });
    assert.equal((await handleView(onDomain, "rep", withDomain("reports.example.com", true))).status, 200); // the domain itself serves the report, no loop
  });
  console.log(`\naccess routes: ${n} checks passed`);
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
