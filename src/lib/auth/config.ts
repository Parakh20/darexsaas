import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma";
import { edgeAuthConfig } from "./edge-config";
import { slugify } from "@/lib/utils";

export const authConfig: NextAuthConfig = {
  ...edgeAuthConfig,
  callbacks: {
    ...edgeAuthConfig.callbacks,
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
  },
};
