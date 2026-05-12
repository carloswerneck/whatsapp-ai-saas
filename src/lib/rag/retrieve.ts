import { prisma } from "@/lib/prisma";
import { embedText } from "./embed";

export async function performRAGRetrieval(
  agentId: string,
  query: string
): Promise<string> {
  const queryEmbedding = await embedText(query);

  const results = await prisma.$queryRaw`
    SELECT dc.content, d.filename, dc.metadata,
           1 - (dc.embedding <=> ${queryEmbedding}::vector) as similarity
    FROM "document_chunks" dc
    JOIN "documents" d ON dc."documentId" = d.id
    WHERE d."agentId" = ${agentId}
      AND d.status = 'READY'
    ORDER BY dc.embedding <=> ${queryEmbedding}::vector
    LIMIT 5
  `;

  if (!results || (results as any[]).length === 0) return "";

  return (results as any[])
    .map((r: any) => `[Source: ${r.filename}]\n${r.content}`)
    .join("\n\n---\n\n");
}