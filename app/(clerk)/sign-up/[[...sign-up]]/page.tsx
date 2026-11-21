import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import AuthShell from "@/components/AuthShell";

export const metadata: Metadata = { title: "Create your account | SheetPress", robots: { index: false } };

export default function Page() {
  return (
    <AuthShell
      footer={<>By creating an account you agree to the <a href="/terms" target="_blank" rel="noopener" className="underline">Terms</a> and <a href="/privacy" target="_blank" rel="noopener" className="underline">Privacy Policy</a>.</>}
    >
      {/* A brand-new account lands on the dashboard with the welcome guide. A visitor who was sent here
          from a protected page still goes back to that page (Clerk honours redirect_url over the fallback). */}
      <SignUp signInUrl="/sign-in" fallbackRedirectUrl="/app?welcome=1" />
    </AuthShell>
  );
}
