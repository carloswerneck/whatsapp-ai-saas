import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.accountId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = session.user.accountId;
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");

  const where: Prisma.DealWhereInput = { accountId };
  if (stage) where.stage = stage;

  const deals = await prisma.deal.findMany({
    where,
    include: { contact: { select: { name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(deals);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.accountId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = session.user.accountId;
  const { title, value, stage, contactId } = await req.json();

  const deal = await prisma.deal.create({
    data: { title, value, stage: stage || "lead", contactId, accountId },
  });

  return NextResponse.json(deal, { status: 201 });
}