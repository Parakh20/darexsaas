import NextAuth from "next-auth";
import { edgeAuthConfig } from "@/lib/auth/edge-config";
export const { auth: middleware } = NextAuth(edgeAuthConfig);
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth|api/webhooks).*)"] };
