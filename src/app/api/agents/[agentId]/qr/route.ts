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
  const accountId = session.user.accountId;

  const agent = await prisma.agent.findFirst({ where: { id: agentId, accountId } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  if (!agent.waInstanceId) {
    return NextResponse.json({ error: "Agent not connected" }, { status: 400 });
  }

  try {
    const status = await EvolutionAPI.getStatus(agent.waInstanceId);

    if (status.state === "CONNECTED") {
      await prisma.agent.update({
        where: { id: agentId },
        data: { waStatus: "CONNECTED", waPhone: status.phone || null },
      });
      return NextResponse.json({ status: "CONNECTED", phone: status.phone });
    }

    const qr = await EvolutionAPI.getQR(agent.waInstanceId);
    return NextResponse.json({ status: "CONNECTING", qr: qr.base64 });
  } catch (error) {
    console.error("QR fetch error:", error);
    return NextResponse.json({ error: "Failed to get QR" }, { status: 500 });
  }
}