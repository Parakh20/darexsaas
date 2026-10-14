import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe subset of the Auth.js config, used by middleware.
 * It must not import Prisma or any Node-only module (such as the pg driver),
 * because middleware runs in the Edge runtime. Database-backed callbacks live
 * in ./config.ts, which extends this object for the Node.js route handlers.
 */
export const edgeAuthConfig = {
  providers: [
    Google({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }),
  ],
  pages: { signIn: "/auth/signin", error: "/auth/error" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic = nextUrl.pathname.startsWith("/auth") || nextUrl.pathname.startsWith("/api/auth") || nextUrl.pathname.startsWith("/api/webhooks") || nextUrl.pathname === "/";
      if (isPublic) return true;
      return isLoggedIn;
    },
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig;
