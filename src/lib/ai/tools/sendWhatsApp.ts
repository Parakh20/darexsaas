import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/prisma";
import type { ToolDefinition, SendWhatsAppInput } from "./types";
import type { ToolContext } from "./types";

async function sendViaMetaAPI(to: string, message: string): Promise<{ messageId: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    // Mock mode: log and return fake id
    return { messageId: `mock_${Date.now()}` };
  }
  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: message } }),
  });
  if (!res.ok) throw new Error(`WhatsApp API error: ${res.status}`);
  const data = await res.json();
  return { messageId: data.messages?.[0]?.id ?? `wa_${Date.now()}` };
}

export const sendWhatsAppTool: ToolDefinition<SendWhatsAppInput> = {
  name: "sendWhatsApp",
  description: "Send a WhatsApp message to a contact",
  parameters: {
    type: "object",
    properties: {
      to: { type: "string", description: "Phone number with country code" },
      message: { type: "string", description: "Message body" },
      contactId: { type: "string" },
    },
    required: ["to", "message"],
  },
  async execute({ to, message, contactId }, { user }: ToolContext) {
    const { messageId } = await sendViaMetaAPI(to, message);
    if (contactId) {
      let conv = await prisma.conversation.findFirst({ where: { tenantId: user.tenantId, contactId, channel: "WHATSAPP" } });
      if (!conv) conv = await prisma.conversation.create({ data: { tenantId: user.tenantId, contactId, channel: "WHATSAPP" } });
      await prisma.message.create({ data: { conversationId: conv.id, direction: "OUTBOUND", body: message, externalId: messageId, status: "SENT" } });
    }
    await createAuditLog({ tenantId: user.tenantId, userId: user.id, action: "ai.sendWhatsApp", entityType: "Contact", entityId: contactId, details: { to, messageId }, aiInitiated: true });
    return { success: true, messageId };
  },
};
