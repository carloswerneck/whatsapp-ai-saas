import { prisma } from "@/lib/prisma";
import { embedText } from "./embed";

interface RAGQueryResult {
  content: string;
  filename: string;
  metadata: unknown;
  similarity: number;
}

export async function performRAGRetrieval(
  agentId: string,
  query: string
): Promise<string> {
  const queryEmbedding = await embedText(query);

  const results = await prisma.$queryRaw<RAGQueryResult[]>`
    SELECT dc.content, d.filename, dc.metadata,
           1 - (dc.embedding <=> ${queryEmbedding}::vector) as similarity
    FROM "document_chunks" dc
    JOIN "documents" d ON dc."documentId" = d.id
    WHERE d."agentId" = ${agentId}
      AND d.status = 'READY'
    ORDER BY dc.embedding <=> ${queryEmbedding}::vector
    LIMIT 5
  `;

  if (!results || results.length === 0) return "";

  return results
    .map((r) => `[Source: ${r.filename}]\n${r.content}`)
    .join("\n\n---\n\n");
}