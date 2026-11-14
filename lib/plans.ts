// Free tier limits, enforced server-side. Paid plans are not live yet.
export const FREE = {
  maxReports: 3,
  maxRowsPerSheet: 1000,
  maxSheets: 10,
  maxColumns: 40,
  maxFileBytes: 2 * 1024 * 1024,
} as const;
