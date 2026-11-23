import { webcrypto as crypto } from "node:crypto";
import { REPORT_TEMPLATE } from "./report-template.generated";
import { SITE_URL } from "./site";

export type Sheet = { name: string; kind: "summary" | "table" | "chart"; headers: string[]; rows: (string | number)[][] };
// Look and feel, set from a "Settings" sheet in the workbook. Everything is validated in lib/parse.ts.
export type Brand = { logo?: string; link?: string; accent?: string; theme?: "light" | "dark"; footer?: string; currency?: string };
// editable: this report is managed from the SheetPress dashboard (add, edit, check off) as well as by .xlsx upload.
export type ReportData = { title: string; subtitle: string; generated: string; sheets: Sheet[]; brand?: Brand; editable?: boolean; template?: "shopping" };
export type EncBlob = { salt: string; iv: string; ct: string; iter: number };
// Who may open a report. Stored beside the data (never inside the public page). Public is the default.
// Per-email access is planned: it will be another mode here ({ mode: "emails", ... }) behind the same gate.
export type Access = { mode: "public" } | { mode: "password"; hash: string; v: number; setAt: string };
// { enc } is the old browser-encrypted protection, kept readable for reports published before server-side access.
export type Payload = { data: ReportData; access?: Access } | { enc: EncBlob };

export class UserError extends Error {}

const b64 = (buf: ArrayBuffer | Uint8Array) => Buffer.from(buf as ArrayBuffer).toString("base64");

export async function encrypt(plain: string, password: string): Promise<EncBlob> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plain));
  return { salt: b64(salt), iv: b64(iv), ct: b64(ct), iter: 200000 };
}

const safeJson = (o: unknown) =>
  JSON.stringify(o).replace(/</g, "\\u003c").replace(new RegExp(String.fromCharCode(0x2028), "g"), "\\u2028").replace(new RegExp(String.fromCharCode(0x2029), "g"), "\\u2029");

export function renderHtml(title: string, payload: Payload): string {
  const js = "enc" in payload ? `window.__ENC__=${safeJson(payload.enc)};` : `window.__DATA__=${safeJson(payload.data)};`;
  return REPORT_TEMPLATE.replace("/*__PAYLOAD__*/", () => js).replace("__TITLE__", () => title.replace(/[<>&"]/g, "")).replace("__SITE_URL__", () => SITE_URL);
}

export function makeSlug(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "report";
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 6);
  return `${base}-${rand}`;
}
