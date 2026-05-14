import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountId = session.user.accountId;
  const agents = await prisma.agent.findMany({
    where: { accountId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(agents);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.accountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountId = session.user.accountId;
  const body = await req.json();

  const agent = await prisma.agent.create({
    data: {
      name: body.name,
      description: body.description,
      purpose: body.purpose,
      accountId,
      systemPrompt: body.systemPrompt || "",
      model: body.model || "gpt-4o",
      temperature: body.temperature ?? 0.7,
      maxTokens: body.maxTokens ?? 2048,
      ragEnabled: body.ragEnabled ?? false,
      humanHandoff: body.humanHandoff ?? true,
      handoffKeyword: body.handoffKeyword || "humano",
      greetingMessage: body.greetingMessage,
      awayMessage: body.awayMessage,
      autoReply: body.autoReply ?? true,
    },
  });

  return NextResponse.json(agent, { status: 201 });
}