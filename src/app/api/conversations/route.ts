import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ConvStatus } from "@/generated/prisma/enums";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.accountId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = session.user.accountId;
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");
  const status = searchParams.get("status");

  const where: { accountId: string; agentId?: string; status?: ConvStatus } = { accountId };
  if (agentId) where.agentId = agentId;
  if (status && Object.values(ConvStatus).includes(status as ConvStatus)) {
    where.status = status as ConvStatus;
  }

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      agent: { select: { name: true } },
      contact: { select: { name: true, phone: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(conversations);
}