import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.accountId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = session.user.accountId;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const agentId = formData.get("agentId") as string;

  if (!file || !agentId) {
    return NextResponse.json({ error: "File and agentId are required" }, { status: 400 });
  }

  // Upload to Supabase Storage
  const storagePath = `documents/${accountId}/${Date.now()}_${file.name}`;

  // Note: In production, upload to Supabase Storage
  // For now, store as a data URL or placeholder
  const storageUrl = storagePath;

  // Create Document record
  const doc = await prisma.document.create({
    data: {
      accountId,
      agentId,
      title: file.name,
      filename: file.name,
      mimeType: file.type,
      fileSize: file.size,
      storageUrl,
      status: "PROCESSING",
    },
  });

  // Trigger document processing in background
  // In production, use a queue (Inngest, QStash, etc.)
  // For now, process inline
  try {
    const { processDocument } = await import("@/lib/rag/process");
    await processDocument(doc.id);
  } catch (error) {
    console.error("Document processing error:", error);
    // Mark as failed but don't fail the upload
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "FAILED", error: String(error) },
    });
  }

  return NextResponse.json(doc, { status: 201 });
}