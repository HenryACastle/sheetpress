// Single source of truth for the public address. Set NEXT_PUBLIC_APP_URL in Vercel; the default is
// the production domain. Changing the domain never needs a code change, only that env var.
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://sheetpress.org").replace(/\/+$/, "");
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
// Optional. Legal pages and the report footer show a contact line only when this is set.
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";
// Marketing switch: set NEXT_PUBLIC_CUSTOM_DOMAINS=1 in Vercel once the Vercel API env vars are set and a
// real domain has been connected end to end. Until then the landing page keeps saying "coming soon".
export const CUSTOM_DOMAINS_LIVE = process.env.NEXT_PUBLIC_CUSTOM_DOMAINS === "1";

// Privacy-friendly visit counting (Vercel Web Analytics: no cookies, no cross-site tracking) on the PUBLIC
// marketing pages only. Off until NEXT_PUBLIC_ANALYTICS=1 is set in Vercel AND Analytics is enabled on the
// Vercel project. The privacy policy text follows this flag, so what it says always matches what runs.
export const ANALYTICS_ON = process.env.NEXT_PUBLIC_ANALYTICS === "1";

// Google tag. NEXT_PUBLIC_GOOGLE_TAG_ID accepts a Tag Manager container (GTM-XXXXXXX) or a GA4 Measurement ID
// (G-XXXXXXXXXX); set it to "off" to disable. It runs only on the public marketing pages, only AFTER a visitor
// accepts (nothing loads from Google and no cookie is set before that), and never on reports, sign-in or the app.
// The privacy policy follows this value. Invalid values are ignored (feature off).
const rawTag = (process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ?? "GTM-KWGFMNGX").trim();
export const GOOGLE_TAG_ID = /^(G-[A-Z0-9]{6,14}|GTM-[A-Z0-9]{4,10})$/.test(rawTag) ? rawTag : "";
export const GOOGLE_TAG_IS_GTM = GOOGLE_TAG_ID.startsWith("GTM-");

// How analytics consent works (only matters when a Google tag is set):
//   "regional" (default): ON by default for visitors outside the EU/EEA, UK and Switzerland, where visitors can
//                         turn it off any time; opt-in banner INSIDE those regions, where law requires prior consent.
//                         If the visitor's country cannot be determined it fails safe to the opt-in banner.
//   "none":               ON by default for everyone, no banner anywhere (opt-out only). Higher legal risk for EU/UK/CH visitors.
//   "optin":              OFF until each visitor accepts, everywhere.
// A browser Global Privacy Control / Do Not Track signal always keeps it off in every mode.
const rawMode = (process.env.NEXT_PUBLIC_CONSENT_MODE ?? "regional").trim().toLowerCase();
export const CONSENT_MODE: "regional" | "none" | "optin" = rawMode === "none" || rawMode === "optin" ? rawMode : "regional";
