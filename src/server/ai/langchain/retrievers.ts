import { BaseRetriever, type BaseRetrieverInput } from "@langchain/core/retrievers";
import { Document } from "@langchain/core/documents";
import { CallbackManagerForRetrieverRun } from "@langchain/core/callbacks/manager";
import { getVectorStore } from "../vectorStore";
import { generateEmbedding } from "../embeddings/provider";

export interface PostgresPgVectorRetrieverInput extends BaseRetrieverInput {
  userId: string;
  topK?: number;
  minSimilarity?: number;
  section?: string;
  scope?: "candidate_private" | "technical_shared" | "all";
}

/**
 * Custom LangChain BaseRetriever backed by PostgreSQL + pgvector
 * with strict tenant isolation (userId filtering).
 */
export class PostgresPgVectorRetriever extends BaseRetriever {
  lc_namespace = ["langchain", "retrievers", "postgres_pgvector"];

  userId: string;
  topK: number;
  minSimilarity: number;
  section?: string;
  scope: "candidate_private" | "technical_shared" | "all";

  constructor(fields: PostgresPgVectorRetrieverInput) {
    super(fields);
    if (!fields.userId) {
      throw new Error("[RETRIEVER ERROR] userId is mandatory for tenant-isolated PostgreSQL pgvector retrieval.");
    }
    this.userId = fields.userId;
    this.topK = fields.topK || 4;
    this.minSimilarity = fields.minSimilarity !== undefined ? fields.minSimilarity : 0.2;
    this.section = fields.section;
    this.scope = fields.scope || "candidate_private";
  }

  async _getRelevantDocuments(
    query: string,
    _runManager?: CallbackManagerForRetrieverRun
  ): Promise<Document[]> {
    if (!query || !query.trim()) {
      return [];
    }

    // 1. Generate query embedding using existing Gemini provider
    const { embedding } = await generateEmbedding(query);

    // 2. Query vector store backed by PostgreSQL pgvector
    const store = await getVectorStore();
    const results = await store.search({
      userId: this.userId,
      queryVector: embedding,
      topK: this.topK,
      minSimilarity: this.minSimilarity,
      section: this.section,
      scope: this.scope
    });

    // 3. Format into standard LangChain Document abstractions
    return results.map(r => new Document({
      pageContent: r.content,
      metadata: {
        chunkId: r.chunkId,
        documentId: r.documentId,
        userId: r.userId,
        section: r.section,
        knowledgeDomain: r.knowledgeDomain,
        similarity: r.similarity,
        ...r.metadata
      }
    }));
  }
}

/**
 * Factory to create a candidate-private LangChain retriever
 */
export function createCandidateRetriever(
  userId: string,
  options: Partial<Omit<PostgresPgVectorRetrieverInput, "userId">> = {}
): PostgresPgVectorRetriever {
  return new PostgresPgVectorRetriever({
    userId,
    ...options
  });
}
