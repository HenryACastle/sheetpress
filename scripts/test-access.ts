process.env.ACCESS_COOKIE_SECRET = "test-secret-one";
import assert from "node:assert/strict";
import { allowAttempt, checkCookie, clearFails, cookieHeader, cookieName, gate, hashPassword, lockPage, newPasswordAccess, readCookie, recordFail, signCookie, validatePassword, verifyPassword } from "../lib/access";
import { UserError } from "../lib/report";

const id = "6f1b2c3d-1111-4222-8333-444455556666";
let n = 0; const t = (name: string, fn: () => void) => { fn(); n++; console.log("PASS ", name); };

t("hash verifies the right password and rejects the wrong one", () => {
  const h = hashPassword("correct horse battery");
  assert.ok(verifyPassword("correct horse battery", h)); assert.ok(!verifyPassword("correct horse batterY", h)); assert.ok(!verifyPassword("", h));
});
t("hash is salted and never contains the password", () => {
  const a = hashPassword("samepassword1"), b = hashPassword("samepassword1");
  assert.notEqual(a, b); assert.ok(!a.includes("samepassword1"));
});
t("a malformed stored hash fails closed", () => { for (const bad of ["", "x", "scrypt$1$2", "md5$a$b$c$d$e"]) assert.equal(verifyPassword("anything", bad), false); });
t("password policy: 8 to 128", () => {
  assert.throws(() => validatePassword("short"), UserError); assert.throws(() => validatePassword("x".repeat(129)), UserError);
  assert.equal(validatePassword("12345678"), "12345678");
});
t("changing the password bumps the version", () => {
  const a = newPasswordAccess("firstpassword", 0), b = newPasswordAccess("secondpassword", a.mode === "password" ? a.v : 0);
  assert.ok(a.mode === "password" && b.mode === "password" && b.v === a.v + 1);
});

const A = newPasswordAccess("opensesame1"); if (A.mode !== "password") throw new Error("x");
const now = 1_700_000_000_000;
t("a signed cookie opens the report", () => assert.ok(checkCookie(signCookie(id, A, now), id, A, now + 1000)));
t("cookie expires after 7 days", () => assert.ok(!checkCookie(signCookie(id, A, now), id, A, now + 8 * 24 * 3600 * 1000)));
t("cookie for another report is rejected", () => assert.ok(!checkCookie(signCookie(id, A, now), "another-report-id", A, now + 1000)));
t("a tampered cookie is rejected", () => {
  const c = signCookie(id, A, now); const parts = c.split(".");
  assert.ok(!checkCookie(parts.slice(0, 2).join(".") + "." + (Number(parts[2]) + 999999999) + "." + parts[3], id, A, now + 1000));
  assert.ok(!checkCookie(c.slice(0, -2) + "xx", id, A, now + 1000)); assert.ok(!checkCookie("garbage", id, A, now)); assert.ok(!checkCookie(undefined, id, A, now));
});
t("changing the password signs everyone out", () => {
  const c = signCookie(id, A, now); const B = newPasswordAccess("a-new-password", A.v);
  assert.ok(checkCookie(c, id, A, now + 1000)); assert.ok(!checkCookie(c, id, B, now + 1000));
});
t("a cookie signed with a different server secret is rejected", () => {
  const c = signCookie(id, A, now); process.env.ACCESS_COOKIE_SECRET = "test-secret-two";
  const ok = checkCookie(c, id, A, now + 1000); process.env.ACCESS_COOKIE_SECRET = "test-secret-one"; assert.ok(!ok);
});
t("gate: public opens, password locks without a cookie, opens with one", () => {
  assert.equal(gate(undefined, undefined, id), "open"); assert.equal(gate({ mode: "public" }, undefined, id), "open");
  assert.equal(gate(A, undefined, id, now), "lock"); assert.equal(gate(A, "junk", id, now), "lock");
  assert.equal(gate(A, signCookie(id, A, now), id, now + 5), "open");
});
t("a public report ignores any cookie", () => assert.equal(gate({ mode: "public" }, "whatever", id), "open"));
t("cookie header is HttpOnly, Secure, SameSite and named per report", () => {
  const h = cookieHeader(id, "v"); assert.ok(/HttpOnly/.test(h) && /Secure/.test(h) && /SameSite=Lax/.test(h) && h.startsWith(cookieName(id) + "="));
  assert.notEqual(cookieName(id), cookieName("00000000-aaaa-bbbb-cccc-ddddeeeeffff"));
});
t("readCookie finds the right cookie among several", () => assert.equal(readCookie("a=1; spa_x=abc.def; b=2", "spa_x"), "abc.def"));
t("brute force brake: 8 failures then blocked, cleared on success", () => {
  const k = "1.2.3.4|r"; for (let i = 0; i < 8; i++) { assert.ok(allowAttempt(k, now)); recordFail(k, now); }
  assert.ok(!allowAttempt(k, now + 1000)); assert.ok(allowAttempt(k, now + 11 * 60 * 1000)); clearFails(k); assert.ok(allowAttempt(k, now));
});
t("lock page escapes the title and error (no HTML injection) and sends no report data", () => {
  const html = lockPage({ title: `<script>alert(1)</script>"`, slug: "x", next: "/r/x", error: `<b>bad</b>`, siteUrl: "https://sheetpress.org" });
  assert.ok(!html.includes("<script>alert(1)") && !html.includes("<b>bad</b>") && html.includes("&lt;script&gt;")); assert.ok(!/__DATA__|__ENC__/.test(html));
  assert.ok(/method="post" action="\/r\/x\/unlock"/.test(html) && /noindex/.test(html));
});
t("lock page only trusts a real https logo and a hex accent", () => {
  const html = lockPage({ title: "t", slug: "x", next: "/", siteUrl: "https://s", brand: { logo: "javascript:alert(1)", accent: "red;}</style><script>" } });
  assert.ok(!html.includes("javascript:") && !html.includes("<script>") && html.includes("#2a7f63"));
});
console.log(`\naccess: ${n} checks passed`);
