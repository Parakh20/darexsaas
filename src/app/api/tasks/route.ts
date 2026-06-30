import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { tenantPrisma } from "@/lib/prisma";
import { ok, err } from "@/lib/utils";
import { z } from "zod";

const CreateSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().optional(),
  contactId: z.string().optional(),
  opportunityId: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["LOW","MEDIUM","HIGH","URGENT"]).optional(),
});

export async function GET(req: NextRequest) {
  const user = await requireSession();
  const tp = tenantPrisma(user);
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const where = status ? { status: status as import("@prisma/client").TaskStatus } : {};
  const tasks = await tp.task.findMany({ where, orderBy: { createdAt: "desc" }, include: { contact: { select: { id: true, name: true } } } });
  return NextResponse.json(ok(tasks));
}

export async function POST(req: NextRequest) {
  const user = await requireSession();
  const body = await req.json();
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json(err(parsed.error.message), { status: 400 });
  const tp = tenantPrisma(user);
  const task = await tp.task.create({
    data: { ...parsed.data, tenantId: user.tenantId, assigneeId: user.id, dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined, priority: (parsed.data.priority ?? "MEDIUM") as import("@prisma/client").Priority },
  });
  return NextResponse.json(ok(task), { status: 201 });
}
