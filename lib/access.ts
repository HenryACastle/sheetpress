import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Access, Brand } from "./report";
import { UserError } from "./report";
import { validLogo } from "./branding";

// ACCESS CONTROL FOR REPORTS. Public or password now; per-email later (another Access mode behind gate()).
// The password is checked on the server. We store only a salted scrypt hash, never the password. A correct
// password earns a signed cookie, tied to the hash, so changing the password signs everyone out.

export const MIN_PASSWORD = 8, MAX_PASSWORD = 128;
export const COOKIE_TTL_MS = 7 * 24 * 3600 * 1000;

export function validatePassword(pw: string): string {
  if (pw.length < MIN_PASSWORD) throw new UserError(`Passwords need at least ${MIN_PASSWORD} characters.`);
  if (pw.length > MAX_PASSWORD) throw new UserError(`Passwords can be up to ${MAX_PASSWORD} characters.`);
  return pw;
}

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const dk = scryptSync(pw, salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64")}$${dk.toString("base64")}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [alg, N, r, p, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  try {
    const want = Buffer.from(hash, "base64");
    const got = scryptSync(pw, Buffer.from(salt, "base64"), want.length, { N: +N, r: +r, p: +p });
    return got.length === want.length && timingSafeEqual(got, want);
  } catch { return false; }
}

export function newPasswordAccess(pw: string, prevV = 0, now = new Date()): Access {
  return { mode: "password", hash: hashPassword(validatePassword(pw)), v: prevV + 1, setAt: now.toISOString() };
}

// ---- the "I already unlocked it" cookie ----
function secret(): string {
  const s = process.env.ACCESS_COOKIE_SECRET || process.env.CLERK_SECRET_KEY;
  if (!s) throw new Error("ACCESS_COOKIE_SECRET (or CLERK_SECRET_KEY) must be set to use password access");
  return s;
}
const mac = (data: string) => createHmac("sha256", secret()).update("sheetpress-access|" + data).digest("base64url");
const fingerprint = (a: Extract<Access, { mode: "password" }>) => createHash("sha256").update(a.hash).digest("base64url").slice(0, 12);
export const cookieName = (reportId: string) => "spa_" + reportId.replace(/-/g, "").slice(0, 12);

export function signCookie(reportId: string, a: Extract<Access, { mode: "password" }>, now = Date.now()): string {
  const body = `${reportId}.${fingerprint(a)}.${now + COOKIE_TTL_MS}`;
  return `${body}.${mac(body)}`;
}

export function checkCookie(value: string | undefined, reportId: string, a: Access | undefined, now = Date.now()): boolean {
  if (!value || !a || a.mode !== "password") return false;
  const i = value.lastIndexOf(".");
  if (i < 0) return false;
  const body = value.slice(0, i), sig = value.slice(i + 1);
  let ok = false;
  try { const want = Buffer.from(mac(body)), got = Buffer.from(sig); ok = want.length === got.length && timingSafeEqual(want, got); } catch { return false; }
  if (!ok) return false;
  const [id, fp, exp] = body.split(".");
  return id === reportId && fp === fingerprint(a) && Number(exp) > now;
}

/** open = show the report; lock = show the password page. The ONE place the decision is made. */
export function gate(access: Access | undefined, cookie: string | undefined, reportId: string, now = Date.now()): "open" | "lock" {
  if (!access || access.mode === "public") return "open";
  return access.mode === "password" && checkCookie(cookie, reportId, access, now) ? "open" : "lock";
}

export const cookieHeader = (reportId: string, value: string) =>
  `${cookieName(reportId)}=${value}; Max-Age=${COOKIE_TTL_MS / 1000}; Path=/; HttpOnly; Secure; SameSite=Lax`;

export function readCookie(header: string | null, name: string): string | undefined {
  for (const part of (header ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

// ---- brute force brake: per instance (not shared across servers), plus the cost of scrypt itself ----
const fails = new Map<string, { n: number; first: number }>();
const WINDOW_MS = 10 * 60 * 1000, MAX_FAILS = 8;
export function allowAttempt(key: string, now = Date.now()): boolean {
  const f = fails.get(key);
  return !f || now - f.first > WINDOW_MS || f.n < MAX_FAILS;
}
export function recordFail(key: string, now = Date.now()) {
  const f = fails.get(key);
  if (!f || now - f.first > WINDOW_MS) fails.set(key, { n: 1, first: now }); else f.n++;
  if (fails.size > 2000) fails.clear();
}
export const clearFails = (key: string) => { fails.delete(key); };

// ---- the password page (server-rendered, so a locked report sends no data at all) ----
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export function lockPage(opts: { title: string; slug: string; next: string; error?: string; brand?: Brand; siteUrl: string }): string {
  const accent = opts.brand?.accent && /^#[0-9a-f]{6}$/i.test(opts.brand.accent) ? opts.brand.accent : "#2a7f63";
  const dark = opts.brand?.theme === "dark";
  const lg = opts.brand?.logo;
  const logo = lg && (/^https:\/\//.test(lg) || validLogo(lg)) ? `<img src="${esc(lg ?? "")}" alt="" style="display:block;max-height:40px;max-width:200px;margin:0 0 16px" referrerpolicy="no-referrer">` : "";
  const bg = dark ? "#16242b" : "#f0f2f5", card = dark ? "#1d2f38" : "#fff", ink = dark ? "#e7edf0" : "#2a4451", line = dark ? "#2f4652" : "#d6dbe3", mute = dark ? "#9db0b9" : "#566b75";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(opts.title)}</title>
<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:${bg};color:${ink};font:15px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.box{width:calc(100% - 32px);max-width:380px;background:${card};border:1px solid ${line};border-radius:12px;padding:24px}h1{margin:0 0 4px;font-size:20px}p{margin:0 0 12px;color:${mute}}
input{width:100%;margin:4px 0 12px;padding:10px;border:1px solid ${line};border-radius:8px;background:${bg};color:${ink};font:inherit}
button{width:100%;padding:10px;border:0;border-radius:8px;background:${accent};color:#111;font:inherit;font-weight:700;cursor:pointer}.err{color:#d6453a;min-height:1.3em;margin:0 0 8px}
a{color:${accent}}small{display:block;margin-top:14px;color:${mute};text-align:center}</style></head><body><main class="box">${logo}<h1>${esc(opts.title)}</h1><p>This report is private. Enter the password to view it.</p>
<form method="post" action="/r/${esc(opts.slug)}/unlock"><input type="hidden" name="next" value="${esc(opts.next)}"><label>Password<input type="password" name="password" autocomplete="current-password" required autofocus></label>
<div class="err" role="alert">${opts.error ? esc(opts.error) : ""}</div><button>Unlock</button></form>${opts.brand?.hideBadge ? "" : `<small>Built with <a href="${esc(opts.siteUrl)}" target="_blank" rel="noopener">SheetPress</a></small>`}</main></body></html>`;
}
