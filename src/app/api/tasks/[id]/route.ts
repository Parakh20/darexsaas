import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { tenantPrisma } from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const UpdateSchema = z.object({
  status: z.enum(["PENDING","IN_PROGRESS","DONE","CANCELLED"]).optional(),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireSession();
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(err(parsed.error.message), { status: 400 });
  const tp = tenantPrisma(user);
  const existing = await tp.task.findFirst({ where: { id: params.id } });
  if (!existing) return NextResponse.json(err("Not found"), { status: 404 });
  const updated = await tp.task.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(ok(updated));
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireSession();
  const tp = tenantPrisma(user);
  const existing = await tp.task.findFirst({ where: { id: params.id } });
  if (!existing) return NextResponse.json(err("Not found"), { status: 404 });
  await tp.task.delete({ where: { id: params.id } });
  return NextResponse.json(ok({ deleted: true }));
}
