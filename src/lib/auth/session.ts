import { auth } from "./index";
import type { SessionUser } from "@/lib/types";
import { NextResponse } from "next/server";

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  const u = session.user as typeof session.user & { id: string; tenantId: string; role: string };
  if (!u.id || !u.tenantId) return null;
  return { id: u.id, tenantId: u.tenantId, email: u.email!, name: u.name ?? null, image: u.image ?? null, role: u.role as import("@prisma/client").UserRole };
}

export async function requireSession() {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export function unauthorized() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
