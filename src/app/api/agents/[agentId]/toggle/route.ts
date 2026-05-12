import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId } = await params;
  const accountId = (session.user as any).accountId;
  const { status } = await req.json();

  const agent = await prisma.agent.findFirst({ where: { id: agentId, accountId } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const updated = await prisma.agent.update({
    where: { id: agentId },
    data: { status },
  });

  return NextResponse.json(updated);
}