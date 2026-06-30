import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { tenantPrisma } from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const CreateSchema = z.object({
  contactId: z.string(),
  title: z.string().min(1).max(300),
  value: z.number().min(0).optional(),
  stage: z.enum(["LEAD","QUALIFIED","PROPOSAL","NEGOTIATION","CLOSED_WON","CLOSED_LOST"]).optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const user = await requireSession();
  const tp = tenantPrisma(user);
  const url = new URL(req.url);
  const stage = url.searchParams.get("stage");
  const where = stage ? { stage: stage as import("@prisma/client").OpportunityStage } : {};
  const [opps, total] = await Promise.all([
    tp.opportunity.findMany({ where, orderBy: { updatedAt: "desc" }, include: { contact: { select: { id: true, name: true, company: true } } } }),
    tp.opportunity.count({ where }),
  ]);
  return NextResponse.json(ok({ data: opps, total }));
}

export async function POST(req: NextRequest) {
  const user = await requireSession();
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(err(parsed.error.message), { status: 400 });
  const tp = tenantPrisma(user);
  const opp = await tp.opportunity.create({
    data: {
      ...parsed.data,
      tenantId: user.tenantId,
      value: parsed.data.value ?? 0,
      expectedCloseDate: parsed.data.expectedCloseDate ? new Date(parsed.data.expectedCloseDate) : undefined,
    },
  });
  return NextResponse.json(ok(opp), { status: 201 });
}
