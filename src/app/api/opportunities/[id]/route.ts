import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { tenantPrisma } from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const UpdateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  value: z.number().min(0).optional(),
  stage: z.enum(["LEAD","QUALIFIED","PROPOSAL","NEGOTIATION","CLOSED_WON","CLOSED_LOST"]).optional(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireSession();
  const tp = tenantPrisma(user);
  const opp = await tp.opportunity.findFirst({ where: { id: params.id }, include: { contact: true, tasks: { orderBy: { createdAt: "desc" }, take: 5 } } });
  if (!opp) return NextResponse.json(err("Not found"), { status: 404 });
  return NextResponse.json(ok(opp));
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireSession();
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(err(parsed.error.message), { status: 400 });
  const tp = tenantPrisma(user);
  const existing = await tp.opportunity.findFirst({ where: { id: params.id } });
  if (!existing) return NextResponse.json(err("Not found"), { status: 404 });
  const updated = await tp.opportunity.update({
    where: { id: params.id },
    data: { ...parsed.data, expectedCloseDate: parsed.data.expectedCloseDate ? new Date(parsed.data.expectedCloseDate) : undefined },
  });
  return NextResponse.json(ok(updated));
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireSession();
  const tp = tenantPrisma(user);
  const existing = await tp.opportunity.findFirst({ where: { id: params.id } });
  if (!existing) return NextResponse.json(err("Not found"), { status: 404 });
  await tp.opportunity.delete({ where: { id: params.id } });
  return NextResponse.json(ok({ deleted: true }));
}
