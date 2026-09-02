import { IVectorStore, VectorChunk, VectorSearchQuery, VectorSearchResult, KnowledgeDomain } from "./types";

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class DevVectorStore implements IVectorStore {
  readonly mode = "dev_vector_memory" as const;
  private chunks: VectorChunk[] = [];

  async insertChunks(chunks: VectorChunk[]): Promise<number> {
    // Remove existing chunks with same ID to prevent duplication
    const newIds = new Set(chunks.map(c => c.id));
    this.chunks = this.chunks.filter(c => !newIds.has(c.id));
    this.chunks.push(...chunks);
    return chunks.length;
  }

  async search(query: VectorSearchQuery): Promise<VectorSearchResult[]> {
    const topK = query.topK || 4;
    const minSim = query.minSimilarity !== undefined ? query.minSimilarity : 0.25;
    const scope = query.scope || "all";

    const filtered = this.chunks.filter(chunk => {
      // 1. Strict Tenant Filtering
      if (scope === "candidate_private") {
        if (chunk.userId !== query.userId || chunk.knowledgeDomain !== "candidate_private") {
          return false;
        }
      } else if (scope === "technical_shared") {
        if (chunk.knowledgeDomain !== "technical_shared" && chunk.knowledgeDomain !== "curriculum_benchmark") {
          return false;
        }
      } else {
        // 'all' scope: either the authenticated user's private data OR shared technical curriculum
        const isOwner = chunk.userId === query.userId;
        const isShared = chunk.knowledgeDomain === "technical_shared" || chunk.knowledgeDomain === "curriculum_benchmark";
        if (!isOwner && !isShared) {
          return false;
        }
      }

      // 2. Section Filtering if requested
      if (query.section && chunk.section.toLowerCase() !== query.section.toLowerCase()) {
        return false;
      }

      return true;
    });

    // Score and rank
    const scored = filtered.map(chunk => ({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      userId: chunk.userId,
      section: chunk.section,
      content: chunk.content,
      similarity: cosineSimilarity(query.queryVector, chunk.embedding),
      knowledgeDomain: chunk.knowledgeDomain,
      metadata: chunk.metadata
    }));

    return scored
      .filter(item => item.similarity >= minSim)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  async deleteByDocumentId(documentId: string, userId: string): Promise<number> {
    const initial = this.chunks.length;
    this.chunks = this.chunks.filter(c => !(c.documentId === documentId && c.userId === userId));
    return initial - this.chunks.length;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const initial = this.chunks.length;
    this.chunks = this.chunks.filter(c => c.userId !== userId);
    return initial - this.chunks.length;
  }

  async clearDomain(domain: KnowledgeDomain): Promise<number> {
    const initial = this.chunks.length;
    this.chunks = this.chunks.filter(c => c.knowledgeDomain !== domain);
    return initial - this.chunks.length;
  }

  async countChunks(userId?: string): Promise<number> {
    if (!userId) return this.chunks.length;
    return this.chunks.filter(c => c.userId === userId).length;
  }
}
