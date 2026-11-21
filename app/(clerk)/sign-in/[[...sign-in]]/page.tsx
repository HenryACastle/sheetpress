import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import AuthShell from "@/components/AuthShell";

export const metadata: Metadata = { title: "Sign in | SheetPress", robots: { index: false } };

export default function Page() {
  return (
    <AuthShell>
      <SignIn signUpUrl="/sign-up" fallbackRedirectUrl="/app" />
    </AuthShell>
  );
}
