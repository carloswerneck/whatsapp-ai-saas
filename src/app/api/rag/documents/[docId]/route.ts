import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { docId } = await params;
  const accountId = (session.user as any).accountId;

  const doc = await prisma.document.findFirst({
    where: { id: docId, accountId },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete chunks first
  await prisma.documentChunk.deleteMany({ where: { documentId: docId } });
  // Delete document
  await prisma.document.delete({ where: { id: docId } });

  // TODO: Delete from Supabase Storage

  return NextResponse.json({ ok: true });
}