import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! }),
  ],
  pages: { signIn: "/auth/signin", error: "/auth/error" },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || account?.provider !== "google") return false;
      try {
        let dbUser = await prisma.user.findUnique({ where: { email: user.email }, include: { tenant: true } });
        if (!dbUser) {
          const name = user.name ?? user.email.split("@")[0];
          const slug = slugify(name) + "-" + Date.now().toString(36);
          const tenant = await prisma.tenant.create({ data: { name: `${name}'s Business`, slug } });
          dbUser = await prisma.user.create({
            data: { email: user.email, name: user.name, image: user.image, googleId: account?.providerAccountId, tenantId: tenant.id, role: "OWNER" },
            include: { tenant: true },
          });
        } else if (account?.providerAccountId && !dbUser.googleId) {
          await prisma.user.update({ where: { id: dbUser.id }, data: { googleId: account.providerAccountId } });
        }
        return true;
      } catch { return false; }
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        const dbUser = await prisma.user.findUnique({ where: { email: session.user.email! } });
        if (dbUser) {
          session.user.id = dbUser.id;
          (session.user as typeof session.user & { tenantId: string; role: string }).tenantId = dbUser.tenantId;
          (session.user as typeof session.user & { role: string }).role = dbUser.role;
        }
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic = nextUrl.pathname.startsWith("/auth") || nextUrl.pathname.startsWith("/api/auth") || nextUrl.pathname.startsWith("/api/webhooks") || nextUrl.pathname === "/";
      if (isPublic) return true;
      return isLoggedIn;
    },
  },
  session: { strategy: "jwt" },
};
