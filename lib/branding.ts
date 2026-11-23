import type { Brand, ReportData } from "./report";
import { FREE } from "./plans";
import { UserError } from "./report";

// BRANDING: logo, colours, theme, footer text, and hiding the "Built with SheetPress" line.
// Two sources: the workbook's Settings sheet (defaults) and the dashboard's Branding panel (wins, survives re-uploads).

export const MAX_LOGO_DATA = 150_000;   // characters of a data: logo (about 110 KB of image)
const DATA_LOGO = /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/]+=*$/;

/** A logo is an https image address, or a small embedded image (png, jpeg, webp, svg). Anything else is dropped. */
export function validLogo(v: unknown): string | undefined {
  const s = String(v ?? "").trim();
  if (/^https:\/\/[^\s"'<>]{4,300}$/i.test(s)) return s;
  if (s.length <= MAX_LOGO_DATA && DATA_LOGO.test(s)) return s;
  return undefined;
}
const httpsUrl = (v: unknown) => { const s = String(v ?? "").trim(); return /^https:\/\/[^\s"'<>]{4,300}$/i.test(s) ? s : undefined; };

export const HEX = /^#[0-9a-f]{6}$/i;

export type BrandingInput = { logo?: string | null; link?: string | null; accent?: string | null; theme?: string | null; footer?: string | null; currency?: string | null; hideBadge?: boolean | null };

/** Clean what the dashboard sends. A null or empty value clears that setting; a bad value is an error the user can fix. */
export function sanitizeBranding(input: BrandingInput): Brand {
  const out: Brand = {};
  const has = (k: keyof BrandingInput) => input[k] !== undefined && input[k] !== null && String(input[k]).trim() !== "";
  if (has("logo")) { const l = validLogo(input.logo); if (!l) throw new UserError("The logo must be an https:// image address, or a PNG, JPEG, WebP or SVG image under about 100 KB."); out.logo = l; }
  if (has("link")) { const l = httpsUrl(input.link); if (!l) throw new UserError("The logo link must start with https://"); out.link = l; }
  if (has("accent")) { const a = String(input.accent).trim().replace(/^([0-9a-f]{6})$/i, "#$1"); if (!HEX.test(a)) throw new UserError("Use a colour like #2a7f63."); out.accent = a.toLowerCase(); }
  if (has("theme")) { const t = String(input.theme).toLowerCase(); if (t !== "light" && t !== "dark") throw new UserError("Theme must be light or dark."); out.theme = t; }
  if (has("footer")) out.footer = String(input.footer).trim().slice(0, 140);
  if (has("currency")) { const c = String(input.currency).trim().slice(0, 3); if (/[<>&"'\s]/.test(c)) throw new UserError("Currency symbol can be up to 3 characters."); out.currency = c; }
  if (input.hideBadge === true && FREE.hideBadge) out.hideBadge = true;
  return out;
}

/** What visitors get: the workbook's Settings as defaults, the dashboard's choices on top. */
export function effectiveBrand(fromWorkbook: Brand | undefined, fromDashboard: Brand | undefined): Brand | undefined {
  const m: Brand = { ...(fromWorkbook ?? {}), ...(fromDashboard ?? {}) };
  if (m.hideBadge && !FREE.hideBadge) delete m.hideBadge;
  return Object.keys(m).length ? m : undefined;
}
export const withBrand = (d: ReportData, dashboard: Brand | undefined): ReportData => {
  const b = effectiveBrand(d.brand, dashboard);
  return { ...d, brand: b };
};

// ---- colour help ----
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
// The page backgrounds the accent has to read against (see lib/report-template.html).
export const BG = { light: "#f0f2f5", dark: "#16242b" } as const;
/** Links, active tabs and chart lines use the accent as TEXT/LINES: they need about 3:1 against the page. */
export function accentReadable(accent: string, theme: "light" | "dark"): boolean { return contrast(accent, BG[theme]) >= 3; }

export const PRESETS: { name: string; accent: string; theme: "light" | "dark" }[] = [
  { name: "SheetPress green", accent: "#2a7f63", theme: "light" },
  { name: "Ocean", accent: "#1f5fbf", theme: "light" },
  { name: "Berry", accent: "#a02060", theme: "light" },
  { name: "Graphite", accent: "#2f3b45", theme: "light" },
  { name: "Night mint", accent: "#31b791", theme: "dark" },
  { name: "Gold on black", accent: "#ffe19f", theme: "dark" },
];
