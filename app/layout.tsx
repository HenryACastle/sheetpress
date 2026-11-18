import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "SheetPress: turn any Excel sheet into a website, a report or an app";
const description = "Upload an .xlsx and publish it as a searchable website, a status report or a private client page. No code, no design work.";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://sheetpress.yeve.dev"),
  title, description, applicationName: "SheetPress",
  openGraph: { title, description, siteName: "SheetPress", type: "website" },
  twitter: { card: "summary", title, description },
};
export const viewport: Viewport = { themeColor: "#2a4451" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en"><body className="min-h-screen">{children}</body></html>
  );
}
