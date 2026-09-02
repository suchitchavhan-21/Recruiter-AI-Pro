export type KnowledgeDomain = "candidate_private" | "technical_shared" | "curriculum_benchmark";

export interface VectorChunk {
  id: string;
  documentId: string;
  userId: string;
  section: string;
  content: string;
  embedding: number[];
  knowledgeDomain: KnowledgeDomain;
  chunkIndex: number;
  tokenCount: number;
  metadata: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface VectorSearchQuery {
  queryVector: number[];
  topK?: number;
  minSimilarity?: number;
  userId: string;
  scope?: "candidate_private" | "technical_shared" | "all";
  section?: string;
}

export interface VectorSearchResult {
  chunkId: string;
  documentId: string;
  userId: string;
  section: string;
  content: string;
  similarity: number;
  knowledgeDomain: KnowledgeDomain;
  metadata: Record<string, any>;
}

export interface IVectorStore {
  readonly mode: "pgvector_postgresql" | "dev_vector_memory";
  
  insertChunks(chunks: VectorChunk[]): Promise<number>;
  search(query: VectorSearchQuery): Promise<VectorSearchResult[]>;
  deleteByDocumentId(documentId: string, userId: string): Promise<number>;
  deleteByUserId(userId: string): Promise<number>;
  clearDomain(domain: KnowledgeDomain): Promise<number>;
  countChunks(userId?: string): Promise<number>;
}
