import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { tenantPrisma } from "@/lib/prisma";
import { ok } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await requireSession();
  const tp = tenantPrisma(user);
  const url = new URL(req.url);
  const channel = url.searchParams.get("channel");
  const where = channel ? { channel: channel as import("@prisma/client").Channel } : {};
  const conversations = await tp.conversation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      contact: { select: { id: true, name: true, company: true } },
      messages: { orderBy: { sentAt: "desc" }, take: 1 },
    },
  });
  return NextResponse.json(ok(conversations));
}
