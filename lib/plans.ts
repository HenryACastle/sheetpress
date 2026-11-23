// Free tier limits, enforced server-side. Paid plans are not live yet.
export const FREE = {
  maxReports: 3,
  maxRowsPerSheet: 1000,
  maxSheets: 10,
  maxColumns: 40,
  maxFileBytes: 2 * 1024 * 1024,
  maxCustomDomains: 1,
  // May a report hide the "Built with SheetPress" line? On while SheetPress has no paid plan; set false when Pro
  // launches and gate it on the plan (the API already checks this flag).
  hideBadge: true,
} as const;
