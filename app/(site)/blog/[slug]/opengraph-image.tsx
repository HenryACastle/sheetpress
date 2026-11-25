import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getAllPosts, getPost } from "@/lib/blog";
import { SITE_HOST } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export function generateStaticParams() { return getAllPosts().map((p) => ({ slug: p.slug })); }

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  const logo = `data:image/png;base64,${(await readFile(path.join(process.cwd(), "public/logo.png"))).toString("base64")}`;
  const title = post?.title ?? "SheetPress";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#2a4451", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={72} height={72} alt="" />
          <div style={{ fontSize: 40, fontWeight: 700, color: "#ffffff", marginLeft: 20 }}>SheetPress</div>
        </div>
        <div style={{ fontSize: title.length > 48 ? 62 : 72, fontWeight: 700, color: "#ffffff", lineHeight: 1.12, maxWidth: 1000 }}>{title}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: "#31b791" }}>
          <span>{SITE_HOST}/blog</span>
          <span style={{ color: "#d6dbe3" }}>Excel to website guides</span>
        </div>
      </div>
    ),
    size,
  );
}
