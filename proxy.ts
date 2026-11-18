import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Clerk runs ONLY where it is needed. The marketing page (/) and published reports (/r/*) are not
// matched below, so they never trigger Clerk's session handshake or load Clerk scripts.
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
  matcher: ["/app/:path*", "/sign-in/:path*", "/sign-up/:path*", "/api/reports/:path*"],
};
