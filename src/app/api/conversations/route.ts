import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = (session.user as any).accountId;
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agentId");
  const status = searchParams.get("status");

  const where: any = { accountId };
  if (agentId) where.agentId = agentId;
  if (status) where.status = status;

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