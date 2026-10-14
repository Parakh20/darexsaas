import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/utils";

export async function GET() {
  const user = await requireSession();
  const conversations = await prisma.chatConversation.findMany({
    where: { tenantId: user.tenantId, userId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: { _count: { select: { messages: true } } },
  });
  return NextResponse.json(ok(conversations));
}

export async function POST() {
  const user = await requireSession();
  const conversation = await prisma.chatConversation.create({
    data: { tenantId: user.tenantId, userId: user.id, title: "New Conversation" },
  });
  return NextResponse.json(ok(conversation), { status: 201 });
}
