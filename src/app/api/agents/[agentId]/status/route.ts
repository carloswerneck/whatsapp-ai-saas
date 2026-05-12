import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { EvolutionAPI } from "@/lib/evolution-api";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId } = await params;
  const accountId = (session.user as any).accountId;

  const agent = await prisma.agent.findFirst({ where: { id: agentId, accountId } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  if (!agent.waInstanceId) {
    return NextResponse.json({ status: "DISCONNECTED" });
  }

  try {
    const status = await EvolutionAPI.getStatus(agent.waInstanceId);

    if (status.state === "CONNECTED") {
      await prisma.agent.update({
        where: { id: agentId },
        data: { waStatus: "CONNECTED" },
      });
    }

    return NextResponse.json({ status: status.state });
  } catch {
    return NextResponse.json({ status: agent.waStatus });
  }
}