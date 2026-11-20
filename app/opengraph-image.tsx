import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITE_HOST } from "@/lib/site";

export const alt = "SheetPress: turn any Excel sheet into a website, a report or an app";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = `data:image/png;base64,${(await readFile(path.join(process.cwd(), "public/logo.png"))).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", background: "#2a4451", padding: 80 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={260} height={260} alt="" />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 60 }}>
          <div style={{ fontSize: 92, fontWeight: 700, color: "#ffffff" }}>SheetPress</div>
          <div style={{ fontSize: 40, color: "#d6dbe3", marginTop: 12, maxWidth: 700 }}>Turn any Excel sheet into a website, a report or an app.</div>
          <div style={{ fontSize: 30, color: "#31b791", marginTop: 28 }}>{SITE_HOST}</div>
        </div>
      </div>
    ),
    size,
  );
}
