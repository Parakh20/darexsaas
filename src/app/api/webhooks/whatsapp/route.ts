import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/prisma";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN ?? "darex_verify_token";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    if (!value?.messages) return NextResponse.json({ received: true });

    for (const msg of value.messages) {
      const from = msg.from;
      const text = msg.text?.body ?? "";
      const waId = msg.id;

      // Find contact by phone (across all tenants - webhook is global)
      const contact = await prisma.contact.findFirst({ where: { phone: { contains: from.slice(-10) } } });
      if (!contact) continue;

      let conv = await prisma.conversation.findFirst({
        where: { tenantId: contact.tenantId, contactId: contact.id, channel: "WHATSAPP" },
      });
      if (!conv) {
        conv = await prisma.conversation.create({
          data: { tenantId: contact.tenantId, contactId: contact.id, channel: "WHATSAPP", externalId: value.metadata?.phone_number_id },
        });
      }

      const alreadyExists = await prisma.message.findFirst({ where: { externalId: waId } });
      if (!alreadyExists) {
        await prisma.message.create({
          data: { conversationId: conv.id, direction: "INBOUND", body: text, externalId: waId, senderPhone: from, status: "DELIVERED" },
        });
        await createAuditLog({ tenantId: contact.tenantId, action: "whatsapp.inbound", entityType: "Conversation", entityId: conv.id, details: { from, text: text.slice(0, 100) }, aiInitiated: false });
      }
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
