import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { createTaskTool } from "@/lib/ai/tools/createTask";
import { sendWhatsAppTool } from "@/lib/ai/tools/sendWhatsApp";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

async function qualifyLead(contactName: string, company: string, notes: string): Promise<{ score: number; reasoning: string }> {
  const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
  const prompt = `You are a B2B lead qualification AI. Score this lead from 0-100.
Name: ${contactName}
Company: ${company}
Notes: ${notes}
Respond in JSON: {"score": number, "reasoning": "brief explanation"}`;
  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const json = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(json);
}

export async function POST(req: NextRequest) {
  const user = await requireSession();
  const { contactId } = await req.json();
  if (!contactId) return NextResponse.json(err("contactId required"), { status: 400 });

  const contact = await prisma.contact.findFirst({ where: { id: contactId, tenantId: user.tenantId } });
  if (!contact) return NextResponse.json(err("Contact not found"), { status: 404 });

  const run = await prisma.workflowRun.create({
    data: { tenantId: user.tenantId, workflowKey: "new-lead-qualification", entityId: contactId, entityType: "Contact", status: "RUNNING", steps: [] as unknown as import("@prisma/client").Prisma.InputJsonValue },
  });

  const steps: unknown[] = [];
  try {
    // Step 1: AI Qualification
    const { score, reasoning } = await qualifyLead(contact.name, contact.company ?? "", contact.notes ?? "");
    steps.push({ step: "ai-qualification", score, reasoning });
    await prisma.contact.update({ where: { id: contactId }, data: { leadScore: score } });

    if (score >= 80) {
      // Step 2: Send WhatsApp (if phone available)
      if (contact.phone) {
        const waResult = await sendWhatsAppTool.execute(
          { to: contact.phone, message: `Hi ${contact.name}! Thanks for your interest. Our team will reach out within 24 hours.`, contactId },
          { user }
        );
        steps.push({ step: "send-whatsapp", result: waResult });
      }

      // Step 3: Create follow-up task
      const taskResult = await createTaskTool.execute(
        { title: `Follow up with ${contact.name} (Score: ${score})`, description: reasoning, contactId, dueDate: "tomorrow", priority: "HIGH" },
        { user }
      );
      steps.push({ step: "create-task", result: taskResult });
    }

    await prisma.workflowRun.update({ where: { id: run.id }, data: { status: "COMPLETED", steps: steps as unknown as import("@prisma/client").Prisma.InputJsonValue, completedAt: new Date(), result: { score, qualified: score >= 80 } } });
    await createAuditLog({ tenantId: user.tenantId, userId: user.id, action: "workflow.new-lead-qualification", entityType: "Contact", entityId: contactId, details: { score, steps }, aiInitiated: true });

    return NextResponse.json(ok({ workflowRunId: run.id, score, qualified: score >= 80, steps }));
  } catch (e) {
    await prisma.workflowRun.update({ where: { id: run.id }, data: { status: "FAILED", error: String(e), completedAt: new Date() } });
    return NextResponse.json(err(String(e)), { status: 500 });
  }
}
