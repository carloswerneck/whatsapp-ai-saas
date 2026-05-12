import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { EvolutionAPI } from "@/lib/evolution-api";
import { NextResponse } from "next/server";

export async function POST(
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
    return NextResponse.json({ error: "Agent not connected" }, { status: 400 });
  }

  try {
    await EvolutionAPI.logout(agent.waInstanceId);
    await EvolutionAPI.deleteInstance(agent.waInstanceId);

    await prisma.agent.update({
      where: { id: agentId },
      data: {
        waStatus: "DISCONNECTED",
        waInstanceId: null,
        waPhone: null,
        waQrCode: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Evolution API disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}