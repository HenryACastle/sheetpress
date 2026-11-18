import { ClerkProvider } from "@clerk/nextjs";

// Clerk only wraps the routes that need it (sign-in, sign-up, dashboard). The marketing page and
// published reports (/r/*) are outside this group on purpose.
export default function ClerkLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Auth URLs pinned here (not env-only) so Clerk never falls back to its hosted Account Portal.
    <ClerkProvider
      appearance={{ variables: { colorPrimary: "#2a7f63", colorForeground: "#2a4451", borderRadius: "0.5rem" } }}
      signInUrl="/sign-in" signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/app" signUpFallbackRedirectUrl="/app" afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
