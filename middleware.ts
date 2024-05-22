// Resource: https://clerk.com/docs/nextjs/middleware#auth-middleware

import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // An array of public routes that don't require authentication.
  publicRoutes: ["/(.*)"],

  // An array of routes to be ignored by the authentication middleware.
  ignoredRoutes: [],
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};