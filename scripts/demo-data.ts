// Fictional sample data for the public demos. No real clients, people or companies.
import type { Sheet } from "../lib/report";

const cities = ["Atlanta","Austin","Boston","Charlotte","Chicago","Dallas","Denver","Houston","Las Vegas","Los Angeles","Miami","Minneapolis","Nashville","New Orleans","New York","Orlando","Philadelphia","Phoenix","Portland","San Diego","Seattle","Tampa","Washington DC"];
const owners = ["Alex","Sam","Priya","Jordan"];
const states = ["Done","Done","In progress","Not started","Blocked","Done","In progress"];
const pct: Record<string, number> = { Done: 1, "In progress": 0.6, "Not started": 0, Blocked: 0.25 };

const rows = cities.map((c, i) => {
  const launch = states[(i * 3 + 1) % states.length];
  const seo = states[(i * 5 + 2) % states.length];
  return [c, `https://${c.toLowerCase().replace(/[^a-z]+/g, "-")}.example.com`, launch, seo, owners[i % owners.length], Math.round(((pct[launch] + pct[seo]) / 2) * 100) / 100];
});
const issues = ["Waiting on DNS change", "Logo files missing", "Awaiting client approval", "Event data feed down", "Hosting plan upgrade pending"];
const blockerRows = rows
  .filter((r) => r[2] === "Blocked" || r[3] === "Blocked")
  .map((r, i) => [r[0], issues[i % issues.length], r[4], "Blocked"]);
const live = rows.filter((r) => r[2] === "Done").length;
const blocked = blockerRows.length;
const avg = Math.round((rows.reduce((n, r) => n + (r[5] as number), 0) / rows.length) * 100);

export const rollout = {
  title: "Q4 Site Rollout",
  subtitle: "Sample report. Fictional data.",
  slug: "demo-q4-site-rollout",
  file: "q4-site-rollout.xlsx",
  sheets: [
    { name: "Summary", kind: "summary", headers: ["Metric", "Value", "Note"], rows: [
      ["Sites live", `${live} / ${rows.length}`, "launch status = Done"],
      ["Open blockers", blocked, "see the Blockers tab"],
      ["Avg. complete", `${avg}%`, "launch + SEO"],
      ["Next milestone", "Holiday pages live", "Dec 1"],
    ] },
    { name: "Sites", kind: "table", headers: ["City", "Site", "Launch", "SEO fixes", "Owner", "Progress %"], rows },
    { name: "Blockers", kind: "table", headers: ["Site", "Issue", "Owner", "Status"], rows: blockerRows },
  ] as Sheet[],
};

const people = [
  ["Maya Chen", "Head of Operations", "Operations", "Austin", "2022-03-14"],
  ["Daniel Okafor", "Senior Engineer", "Engineering", "Remote", "2021-08-02"],
  ["Sofia Alvarez", "Account Manager", "Sales", "Miami", "2023-01-23"],
  ["Liam Brooks", "Designer", "Design", "Remote", "2024-05-06"],
  ["Hana Kobayashi", "Engineering Manager", "Engineering", "Seattle", "2020-11-09"],
  ["Noah Patel", "Sales Lead", "Sales", "Miami", "2022-09-19"],
  ["Ava Johnson", "Operations Analyst", "Operations", "Austin", "2025-02-10"],
  ["Ethan Rossi", "Support Specialist", "Support", "Remote", "2024-10-28"],
  ["Zoe Martin", "Product Designer", "Design", "Seattle", "2023-06-12"],
  ["Omar Haddad", "Support Lead", "Support", "Austin", "2021-04-05"],
  ["Ivy Nguyen", "Software Engineer", "Engineering", "Remote", "2025-07-14"],
  ["Lucas Meyer", "Sales Associate", "Sales", "Seattle", "2025-09-01"],
].map(([n, r, d, l, s]) => [n, r, d, l, `https://example.com/team/${n.toLowerCase().replace(/[^a-z]+/g, "-")}`, s]);

export const directory = {
  title: "Team Directory",
  subtitle: "Sample directory. Fictional people.",
  slug: "demo-team-directory",
  file: "team-directory.xlsx",
  sheets: [
    { name: "Summary", kind: "summary", headers: ["Metric", "Value", "Note"], rows: [
      ["Headcount", people.length, "all teams"],
      ["Teams", 4 + 1, "Operations, Engineering, Sales, Design, Support"],
      ["Locations", 4, "Austin, Miami, Seattle, Remote"],
      ["Joined this year", people.filter((p) => String(p[5]).startsWith("2025")).length, ""],
    ] },
    { name: "People", kind: "table", headers: ["Name", "Role", "Team", "Location", "Profile", "Start date"], rows: people },
  ] as Sheet[],
};
