import { clerkMiddleware } from "@clerk/nextjs/server";

// Attaches the Clerk session to every request. No route is blocked here:
// guests can browse, and each page or action checks the session itself.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Everything except Next.js internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
  ],
};
