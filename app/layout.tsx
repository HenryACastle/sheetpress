import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://sheetpress.yeve.dev"),
  title: "Sheetpress: turn an Excel file into a shareable report site",
  description: "Upload an .xlsx and get a clean, searchable, password-protectable report page you can share with your team.",
};
export const viewport: Viewport = { themeColor: "#2a4451" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en"><body className="min-h-screen">{children}</body></html>
  );
}
