import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const posts = getAllPosts();
  const latest = posts[0] ? new Date(`${posts[0].updated ?? posts[0].date}T12:00:00Z`) : now;
  return [
    ...["", "/docs", "/privacy", "/terms"].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now })),
    { url: `${SITE_URL}/blog`, lastModified: latest },
    ...posts.map((p) => ({ url: `${SITE_URL}/blog/${p.slug}`, lastModified: new Date(`${p.updated ?? p.date}T12:00:00Z`) })),
  ];
}
