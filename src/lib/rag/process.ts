import { prisma } from "@/lib/prisma";
import { chunkText } from "./chunk";
import { embedText } from "./embed";

export async function processDocument(docId: string) {
  const doc = await prisma.document.findUnique({ where: { id: docId } });
  if (!doc) return;

  try {
    // Extract text from stored document
    let text: string;

    if (doc.mimeType === "application/pdf") {
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      const response = await fetch(doc.storageUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      const parsed = await pdfParse(buffer);
      text = parsed.text;
    } else if (doc.mimeType === "text/plain") {
      const response = await fetch(doc.storageUrl);
      text = await response.text();
    } else {
      throw new Error(`Unsupported file type: ${doc.mimeType}`);
    }

    // Chunk
    const chunks = chunkText(text);

    // Embed and store each chunk using raw SQL for pgvector
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await embedText(chunks[i]);

      await prisma.$executeRaw`
        INSERT INTO "document_chunks" (id, "documentId", content, "chunkIndex", embedding, metadata)
        VALUES (${crypto.randomUUID()}, ${doc.id}, ${chunks[i]}, ${i}, ${embedding}::vector, ${JSON.stringify({ source: doc.filename, chunk: i })}::jsonb)
      `;
    }

    // Update document status
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "READY", chunkCount: chunks.length },
    });
  } catch (error) {
    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "FAILED", error: String(error) },
    });
  }
}