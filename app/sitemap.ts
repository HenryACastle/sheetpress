import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["", "/docs", "/privacy", "/terms"].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now }));
}
