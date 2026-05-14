import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId } = await params;
  const accountId = session.user.accountId;

  const agent = await prisma.agent.findFirst({
    where: { id: agentId, accountId },
    include: {
      documents: { select: { id: true, title: true, status: true, createdAt: true } },
      _count: { select: { conversations: true } },
    },
  });

  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  return NextResponse.json(agent);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId } = await params;
  const accountId = session.user.accountId;
  const body = await req.json();

  const agent = await prisma.agent.findFirst({ where: { id: agentId, accountId } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const updated = await prisma.agent.update({
    where: { id: agentId },
    data: {
      name: body.name,
      description: body.description,
      purpose: body.purpose,
      systemPrompt: body.systemPrompt,
      model: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens,
      ragEnabled: body.ragEnabled,
      humanHandoff: body.humanHandoff,
      handoffKeyword: body.handoffKeyword,
      greetingMessage: body.greetingMessage,
      awayMessage: body.awayMessage,
      autoReply: body.autoReply,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId } = await params;
  const accountId = session.user.accountId;

  const agent = await prisma.agent.findFirst({ where: { id: agentId, accountId } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  await prisma.agent.delete({ where: { id: agentId } });
  return NextResponse.json({ ok: true });
}