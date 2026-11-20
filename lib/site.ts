// Single source of truth for the public address. Set NEXT_PUBLIC_APP_URL in Vercel; the default is
// the production domain. Changing the domain never needs a code change, only that env var.
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://sheetpress.org").replace(/\/+$/, "");
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");
// Optional. Legal pages and the report footer show a contact line only when this is set.
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";
