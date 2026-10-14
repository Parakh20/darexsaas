import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log("Seeding database...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-tenant" },
    update: {},
    create: { name: "Demo Company", slug: "demo-tenant", industry: "SaaS", description: "Demo tenant for testing" },
  });

  const user = await prisma.user.upsert({
    where: { email: "demo@darex.ai" },
    update: {},
    create: { tenantId: tenant.id, email: "demo@darex.ai", name: "Demo User", role: "OWNER" },
  });

  const rahul = await prisma.contact.upsert({
    where: { id: "rahul-seed-001" },
    update: {},
    create: {
      id: "rahul-seed-001",
      tenantId: tenant.id,
      name: "Rahul Sharma",
      email: "rahul.sharma@acmecorp.com",
      phone: "+919876543210",
      company: "Acme Corp",
      position: "CTO",
      leadScore: 85,
      tags: ["enterprise", "hot-lead"],
      notes: "Very interested in our AI features. Budget confirmed at 5L. Decision maker.",
      source: "LinkedIn",
    },
  });

  const opp = await prisma.opportunity.upsert({
    where: { id: "opp-rahul-001" },
    update: {},
    create: {
      id: "opp-rahul-001",
      tenantId: tenant.id,
      contactId: rahul.id,
      title: "Acme Corp - AI Platform License",
      value: 500000,
      stage: "QUALIFIED",
      probability: 70,
      notes: "Rahul wants to pilot the AI agent module first. Follow up after demo.",
    },
  });

  const conv = await prisma.conversation.upsert({
    where: { id: "conv-rahul-001" },
    update: {},
    create: {
      id: "conv-rahul-001",
      tenantId: tenant.id,
      contactId: rahul.id,
      channel: "WHATSAPP",
      aiSentiment: "POSITIVE",
      aiIntent: "Purchase inquiry",
      aiSummary: "Rahul is interested in piloting the platform. Budget confirmed.",
    },
  });

  await prisma.message.createMany({
    skipDuplicates: true,
    data: [
      { conversationId: conv.id, direction: "INBOUND", body: "Hi, I saw your AI platform demo. Very impressive! How much does it cost?", senderPhone: "+919876543210", status: "READ" },
      { conversationId: conv.id, direction: "OUTBOUND", body: "Thanks Rahul! Great to hear. Our enterprise plan starts at 5L/year. Shall I schedule a detailed demo?", status: "READ" },
      { conversationId: conv.id, direction: "INBOUND", body: "Yes please! I have budget approval. Let us schedule for next week.", senderPhone: "+919876543210", status: "READ" },
    ],
  });

  await prisma.task.upsert({
    where: { id: "task-rahul-001" },
    update: {},
    create: {
      id: "task-rahul-001",
      tenantId: tenant.id,
      assigneeId: user.id,
      contactId: rahul.id,
      opportunityId: opp.id,
      title: "Schedule product demo with Rahul Sharma",
      description: "Rahul has budget approval. Demo should focus on AI agent capabilities.",
      priority: "HIGH",
      aiGenerated: false,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("Seeded: tenant, user, Rahul contact, opportunity, WhatsApp conversation, task");
  console.log("Demo: Ask the AI agent: Follow up with Rahul tomorrow");
}

main().catch(console.error).finally(() => prisma.$disconnect());
