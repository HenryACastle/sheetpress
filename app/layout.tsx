import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://sheetpress.yeve.dev"),
  title: "Sheetpress: turn an Excel file into a shareable report site",
  description: "Upload an .xlsx and get a clean, searchable, password-protectable report page you can share with your team.",
};
export const viewport: Viewport = { themeColor: "#2f5bea" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Auth URLs pinned here (not env-only) so Clerk never falls back to its hosted Account Portal.
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" signInFallbackRedirectUrl="/app" signUpFallbackRedirectUrl="/app" afterSignOutUrl="/">
      <html lang="en"><body className="min-h-screen">{children}</body></html>
    </ClerkProvider>
  );
}
