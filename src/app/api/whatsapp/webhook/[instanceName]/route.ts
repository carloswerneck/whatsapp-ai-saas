import { processIncomingMessage } from "@/lib/agent-loop";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ instanceName: string }> }
) {
  const { instanceName } = await params;

  try {
    const payload = await req.json();

    // Process incoming WhatsApp message
    // Only handle text messages
    if (payload.data?.message?.conversation) {
      await processIncomingMessage({
        instance: instanceName,
        data: payload.data,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    // Always return 200 to Evolution API
    return NextResponse.json({ ok: true });
  }
}