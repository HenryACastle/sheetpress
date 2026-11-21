import { DomainError, type VercelConfig, type VercelDomain } from "./domains";

// Thin client for the Vercel REST API (projects/domains). Needs three server-only env vars:
//   VERCEL_API_TOKEN   an access token scoped to the team that owns the project
//   VERCEL_PROJECT_ID  the SheetPress project id (or name)
//   VERCEL_TEAM_ID     the team id (omit for a personal account)
export type FetchLike = (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<{ status: number; json(): Promise<unknown> }>;
export type VercelEnv = { token: string; project: string; team?: string };

export const vercelEnv = (): VercelEnv | null => {
  const token = process.env.VERCEL_API_TOKEN, project = process.env.VERCEL_PROJECT_ID;
  return token && project ? { token, project, team: process.env.VERCEL_TEAM_ID || undefined } : null;
};
export const vercelConfigured = () => vercelEnv() !== null;

type ApiErr = { error?: { code?: string; message?: string } };

export function vercelApi(env: VercelEnv, fetchImpl: FetchLike = fetch as unknown as FetchLike) {
  const q = (extra: Record<string, string> = {}) => {
    const p = new URLSearchParams(extra);
    if (env.team) p.set("teamId", env.team);
    const s = p.toString();
    return s ? `?${s}` : "";
  };
  async function call(method: string, path: string, query: Record<string, string> = {}, body?: unknown) {
    const res = await fetchImpl(`https://api.vercel.com${path}${q(query)}`, {
      method,
      headers: { Authorization: `Bearer ${env.token}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let json: unknown = null;
    try { json = await res.json(); } catch { /* empty body */ }
    return { status: res.status, json };
  }
  const proj = encodeURIComponent(env.project);
  const msg = (j: unknown) => (j as ApiErr)?.error?.message ?? "";
  const fail = (status: number, j: unknown): never => {
    if (status === 401 || status === 403 && !msg(j)) { console.error("vercel auth/permission error", status, msg(j)); throw new Error("Vercel API rejected the token (check VERCEL_API_TOKEN and VERCEL_TEAM_ID)"); }
    console.error("vercel api error", status, JSON.stringify(j)); throw new Error(`Vercel API error ${status}`);
  };

  return {
    // Adds the domain to the project. Safe to call again for a domain already on the project.
    async addDomain(name: string): Promise<VercelDomain> {
      const r = await call("POST", `/v10/projects/${proj}/domains`, {}, { name });
      if (r.status === 200) return r.json as VercelDomain;
      if (r.status === 400 && /already|exists/i.test(msg(r.json))) {
        const existing = await this.getProjectDomain(name);
        if (existing) return existing;
      }
      if (r.status === 409) throw new DomainError("That domain is already in use by another site on our hosting provider, so it cannot be connected here. Try a different subdomain.");
      if (r.status === 403 && /access to the domain/i.test(msg(r.json))) throw new DomainError("That domain is registered to another account on our hosting provider and cannot be added.");
      if (r.status === 400) throw new DomainError(msg(r.json) || "That domain could not be added. Check the spelling and try again.");
      return fail(r.status, r.json);
    },
    async getProjectDomain(name: string): Promise<VercelDomain | null> {
      const r = await call("GET", `/v9/projects/${proj}/domains/${encodeURIComponent(name)}`);
      if (r.status === 404) return null;
      if (r.status !== 200) return fail(r.status, r.json);
      return r.json as VercelDomain;
    },
    // Asks Vercel to re-check the TXT challenge. A wrong or missing TXT record is an expected outcome, not an error.
    async verifyDomain(name: string): Promise<{ verified: boolean }> {
      const r = await call("POST", `/v9/projects/${proj}/domains/${encodeURIComponent(name)}/verify`);
      if (r.status === 200) return { verified: (r.json as VercelDomain).verified === true };
      if (r.status === 400 || r.status === 404) return { verified: false };
      return fail(r.status, r.json);
    },
    async getConfig(name: string): Promise<VercelConfig> {
      const r = await call("GET", `/v6/domains/${encodeURIComponent(name)}/config`, { projectIdOrName: env.project });
      if (r.status !== 200) return fail(r.status, r.json);
      return r.json as VercelConfig;
    },
    async removeDomain(name: string): Promise<void> {
      const r = await call("DELETE", `/v9/projects/${proj}/domains/${encodeURIComponent(name)}`);
      if (r.status === 200 || r.status === 404) return;
      return fail(r.status, r.json);
    },
  };
}
export type VercelApi = ReturnType<typeof vercelApi>;
