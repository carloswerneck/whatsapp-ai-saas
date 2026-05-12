import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dealId } = await params;
  const accountId = (session.user as any).accountId;
  const body = await req.json();

  const deal = await prisma.deal.findFirst({ where: { id: dealId, accountId } });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.deal.update({
    where: { id: dealId },
    data: {
      title: body.title,
      value: body.value,
      stage: body.stage,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dealId } = await params;
  const accountId = (session.user as any).accountId;

  const deal = await prisma.deal.findFirst({ where: { id: dealId, accountId } });
  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.deal.delete({ where: { id: dealId } });
  return NextResponse.json({ ok: true });
}