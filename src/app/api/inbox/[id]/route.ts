import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { tenantPrisma } from "@/lib/prisma";
import { ok, err } from "@/lib/utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await requireSession();
  const tp = tenantPrisma(user);
  const conv = await tp.conversation.findFirst({
    where: { id: params.id },
    include: { contact: true, messages: { orderBy: { sentAt: "asc" } } },
  });
  if (!conv) return NextResponse.json(err("Not found"), { status: 404 });
  return NextResponse.json(ok(conv));
}
