import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { streamChat } from "@/lib/ai/chat";
import { ok, err } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireSession();
  const conv = await prisma.chatConversation.findFirst({ where: { id: params.id, tenantId: user.tenantId } });
  if (!conv) return NextResponse.json(err("Not found"), { status: 404 });
  const messages = await prisma.chatMessage.findMany({
    where: { chatConversationId: params.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(ok(messages));
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireSession();
  const conv = await prisma.chatConversation.findFirst({ where: { id: params.id, tenantId: user.tenantId } });
  if (!conv) return NextResponse.json(err("Not found"), { status: 404 });

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json(err("Message required"), { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamChat(params.id, message, { user })) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(e) })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
