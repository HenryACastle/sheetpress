import { SITE_HOST } from "./site";
import { FREE } from "./plans";

export class DomainError extends Error {}

// Hosts that are OURS. Anything else reaching the app is treated as a customer's custom domain.
const OWN = new Set(["sheetpress.org", "www.sheetpress.org", "sheetpress.yeve.dev", "localhost", "127.0.0.1"]);
export function isOwnHost(hostHeader: string | null | undefined): boolean {
  const h = (hostHeader ?? "").toLowerCase().replace(/:\d+$/, "");
  if (!h) return true; // no host header: never treat as a customer domain
  if (OWN.has(h) || h === SITE_HOST.toLowerCase().replace(/:\d+$/, "")) return true;
  return h.endsWith(".vercel.app") || h.endsWith(".localhost");
}

const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/;
const RESERVED_APEX = new Set(["sheetpress.org", "sheetpress.yeve.dev", "yeve.dev", "vercel.app", "vercel.com", "localhost"]);

// Accepts what people actually paste ("https://Reports.Acme.com/path") and returns a bare lower-case hostname.
export function normalizeDomain(input: string): string {
  let d = String(input ?? "").trim().toLowerCase();
  d = d.replace(/^[a-z][a-z0-9+.-]*:\/\//, "").replace(/[/?#].*$/, "").replace(/:\d+$/, "").replace(/\.$/, "");
  if (!d) throw new DomainError("Enter a domain, like reports.yourcompany.com.");
  if (/\s/.test(d) || d.includes("@")) throw new DomainError("That does not look like a domain name.");
  if (d.startsWith("*.")) throw new DomainError("Wildcard domains are not supported.");
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(d) || d.includes(":")) throw new DomainError("Use a domain name, not an IP address.");
  const labels = d.split(".");
  if (labels.length < 2) throw new DomainError("Enter a full domain, like reports.yourcompany.com.");
  if (d.length > 253 || !labels.every((l) => LABEL.test(l))) throw new DomainError("That does not look like a valid domain name.");
  if (!/^[a-z]{2,}$|^xn--[a-z0-9-]+$/.test(labels[labels.length - 1])) throw new DomainError("That domain ends with an invalid extension.");
  for (const r of RESERVED_APEX) if (d === r || d.endsWith("." + r)) throw new DomainError("That domain belongs to SheetPress or its hosting provider and cannot be used.");
  if (isOwnHost(d)) throw new DomainError("That address is already used by SheetPress.");
  return d;
}

// ---- link names (slugs) ----
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RESERVED_SLUG = new Set(["api", "app", "admin", "sign-in", "sign-up", "privacy", "terms", "demo", "r", "new", "null", "undefined"]);
export function normalizeSlug(input: string): string {
  const s = String(input ?? "").trim().toLowerCase().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  if (s.length < 3) throw new DomainError("Link names need at least 3 letters or numbers.");
  if (s.length > 60) throw new DomainError("Link names can be up to 60 characters.");
  if (!SLUG.test(s)) throw new DomainError("Use letters, numbers and single dashes only.");
  if (RESERVED_SLUG.has(s) || s.startsWith("demo-")) throw new DomainError("That link name is reserved. Try another.");
  return s;
}

// ---- DNS instructions the UI shows ----
export type DnsRecord = { type: "A" | "CNAME" | "TXT"; name: string; value: string; purpose: string };
// "securing": DNS is right but the HTTPS certificate is not ready yet (Vercel issues it after DNS verifies).
export type DomainState = "needs_txt" | "needs_dns" | "securing" | "live";
export type DomainStatus = { domain: string; state: DomainState; records: DnsRecord[]; isApex: boolean; message: string };

export type VercelDomain = { name: string; apexName: string; verified: boolean; verification?: { type: string; domain: string; value: string; reason: string }[] };
export type VercelConfig = { configuredBy: string | null; misconfigured: boolean; recommendedCNAME?: { rank: number; value: string }[]; recommendedIPv4?: { rank: number; value: string[] }[] };

// The host part to type into a DNS provider ("reports" for reports.acme.com, "@" for acme.com).
export function dnsHostName(domain: string, apexName: string): string {
  if (domain === apexName) return "@";
  return domain.endsWith("." + apexName) ? domain.slice(0, -(apexName.length + 1)) : domain;
}
const best = <T extends { rank: number }>(a?: T[]) => (a && a.length ? [...a].sort((x, y) => x.rank - y.rank)[0] : undefined);

export function deriveStatus(domain: string, d: VercelDomain, cfg: VercelConfig | null): DomainStatus {
  const isApex = domain === d.apexName;
  const name = dnsHostName(domain, d.apexName);
  const records: DnsRecord[] = [];
  if (!d.verified) {
    for (const v of d.verification ?? []) {
      if (v.type.toUpperCase() === "TXT") records.push({ type: "TXT", name: dnsHostName(v.domain, d.apexName), value: v.value, purpose: "Proves you own this domain" });
    }
  }
  const cname = best(cfg?.recommendedCNAME)?.value?.replace(/\.$/, "") ?? "cname.vercel-dns.com";
  const ip = best(cfg?.recommendedIPv4)?.value?.[0] ?? "76.76.21.21";
  records.push(isApex
    ? { type: "A", name: "@", value: ip, purpose: "Points your domain at SheetPress" }
    : { type: "CNAME", name, value: cname, purpose: "Points your domain at SheetPress" });
  if (!d.verified) return { domain, state: "needs_txt", records, isApex, message: "Add the records below at your DNS provider, then press Check now." };
  if (!cfg || cfg.misconfigured) return { domain, state: "needs_dns", records, isApex, message: "Waiting for your DNS record. This usually takes a few minutes, but can take up to a few hours." };
  return { domain, state: "live", records: [], isApex, message: "Your domain is live." };
}

export const SECURING_MESSAGE = "Your DNS is correct. We are waiting for the secure (HTTPS) certificate, which usually takes a few minutes and can take up to an hour. Your address will not open securely until this finishes. You can leave this page: we keep checking, and it turns Live when it is ready.";

/** Vercel saying "configured" is not enough: the secure address must actually answer. */
export function applyHttps(s: DomainStatus, httpsOk: boolean): DomainStatus {
  if (s.state !== "live" || httpsOk) return s;
  return { ...s, state: "securing", message: SECURING_MESSAGE };
}

/** Value for reports.domain_verified. A failed probe never takes down a domain that was already serving. */
export function nextVerified(state: DomainState, current: boolean): boolean {
  if (state === "live") return true;
  if (state === "securing") return current;
  return false;
}

export const canAddDomain = (currentCount: number) => currentCount < FREE.maxCustomDomains;
