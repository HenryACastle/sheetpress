// Countries where analytics cookies need the visitor's consent BEFORE they are set (ePrivacy / GDPR / UK GDPR /
// Swiss law): EU member states, EEA (IS, LI, NO), UK (GB) and Switzerland (CH), plus the crown dependencies and
// overseas territories that follow the same rules. Anything not listed is treated as default-on (opt-out) in "regional" mode.
const OPT_IN = new Set([
  // EU 27
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // EEA, UK, Switzerland
  "IS", "LI", "NO", "GB", "CH",
  // territories that follow EU / UK rules
  "AX", "GP", "MQ", "GF", "RE", "YT", "GI", "GG", "JE", "IM",
]);

/** true = ask first; also true when the country is unknown (fail safe). */
export function requiresOptIn(country: string | null | undefined): boolean {
  const c = (country ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return true; // unknown or malformed (Vercel sends "XX"/empty when it cannot tell) => ask
  if (c === "XX" || c === "T1") return true; // unknown / Tor
  return OPT_IN.has(c);
}
