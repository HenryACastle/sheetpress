import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Owner area + report management API require login. Published reports (/r/*) stay public
// (password-protected ones are encrypted at rest).
const isPage = createRouteMatcher(["/app(.*)"]);
const isApi = createRouteMatcher(["/api/reports(.*)"]);

export default clerkMiddleware(
  async (auth, req) => {
    if (isApi(req)) {
      const { userId } = await auth();
      if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else if (isPage(req)) {
      await auth.protect();
    }
  },
  // Pinned so Clerk redirects to our own pages, never its hosted Account Portal.
  { signInUrl: "/sign-in", signUpUrl: "/sign-up" },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
