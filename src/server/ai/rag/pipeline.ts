import { getVectorStore, VectorChunk, VectorSearchResult, KnowledgeDomain } from "../vectorStore";
import { generateEmbedding, generateBatchEmbeddings } from "../embeddings/provider";
import { chunkDocumentBySection } from "./chunking";
import { generateUUID } from "../../db/repository";

/**
 * Indexes candidate resume into RAG vector storage with section-aware chunking and tenant isolation.
 */
export async function indexResumeDocument(params: {
  resumeId: string;
  userId: string;
  resumeText: string;
  metadata?: Record<string, any>;
}): Promise<number> {
  const store = await getVectorStore();
  
  // 1. Delete previous chunks for this resume if re-indexing
  await store.deleteByDocumentId(params.resumeId, params.userId);

  // 2. Chunk text by sections
  const textChunks = chunkDocumentBySection(params.resumeText);
  if (textChunks.length === 0) return 0;

  // 3. Generate embeddings in bounded batches
  const embeddings = await generateBatchEmbeddings(textChunks.map(c => `${c.section}: ${c.content}`));

  // 4. Construct vector chunks with tenant isolation
  const vectorChunks: VectorChunk[] = textChunks.map((tc, idx) => ({
    id: generateUUID(),
    documentId: params.resumeId,
    userId: params.userId,
    section: tc.section,
    content: tc.content,
    embedding: embeddings[idx].embedding,
    knowledgeDomain: "candidate_private" as KnowledgeDomain,
    chunkIndex: tc.chunkIndex,
    tokenCount: tc.tokenCount,
    metadata: {
      ...params.metadata,
      source: "resume_upload",
      embeddingModel: embeddings[idx].model
    }
  }));

  // 5. Insert into vector store
  return await store.insertChunks(vectorChunks);
}

/**
 * Indexes shared technical curriculum into the shared knowledge base.
 */
export async function indexTechnicalCurriculum(documents: Array<{
  id: string;
  title: string;
  content: string;
  section?: string;
  metadata?: Record<string, any>;
}>): Promise<number> {
  const store = await getVectorStore();
  const vectorChunks: VectorChunk[] = [];

  for (const doc of documents) {
    const textChunks = chunkDocumentBySection(doc.content);
    const embeddings = await generateBatchEmbeddings(textChunks.map(c => `${doc.title} - ${c.section}: ${c.content}`));

    for (let i = 0; i < textChunks.length; i++) {
      const tc = textChunks[i];
      vectorChunks.push({
        id: generateUUID(),
        documentId: doc.id,
        userId: "system",
        section: tc.section || doc.section || "Technical",
        content: tc.content,
        embedding: embeddings[i].embedding,
        knowledgeDomain: "technical_shared" as KnowledgeDomain,
        chunkIndex: tc.chunkIndex,
        tokenCount: tc.tokenCount,
        metadata: {
          ...doc.metadata,
          title: doc.title,
          source: "system_curriculum"
        }
      });
    }
  }

  return await store.insertChunks(vectorChunks);
}

/**
 * Retrieves candidate's private resume evidence strictly isolated to the authenticated user.
 */
export async function retrieveCandidateEvidence(
  userId: string,
  query: string,
  topK: number = 4
): Promise<VectorSearchResult[]> {
  const store = await getVectorStore();
  const embeddingRes = await generateEmbedding(query);

  return await store.search({
    queryVector: embeddingRes.embedding,
    userId,
    scope: "candidate_private",
    topK,
    minSimilarity: 0.3
  });
}

/**
 * Retrieves shared system technical knowledge and interview benchmarks.
 */
export async function retrieveTechnicalKnowledge(
  query: string,
  topK: number = 4
): Promise<VectorSearchResult[]> {
  const store = await getVectorStore();
  const embeddingRes = await generateEmbedding(query);

  return await store.search({
    queryVector: embeddingRes.embedding,
    userId: "system",
    scope: "technical_shared",
    topK,
    minSimilarity: 0.25
  });
}

/**
 * Deletes all vector chunks associated with a specific resume document.
 */
export async function deleteResumeVectors(
  resumeId: string,
  userId: string
): Promise<number> {
  const store = await getVectorStore();
  return await store.deleteByDocumentId(resumeId, userId);
}

import { calculateEvidenceBasedATSScore } from "../ats/evidenceScorer";

/**
 * Evaluates candidate evidence against Job Description requirements using grounded RAG retrieval.
 */
export async function matchJDWithCandidateEvidence(params: {
  jdText: string;
  userId: string;
  role?: string;
}): Promise<{
  overallMatchScore: number;
  matchedRequirements: Array<{
    requirement: string;
    evidence: string;
    confidence: number;
    supported: boolean;
    section: string;
  }>;
  missingSkills: string[];
}> {
  const atsResult = await calculateEvidenceBasedATSScore(params);

  const matchedList = [
    ...atsResult.matchedRequirements.map(m => ({
      requirement: m.requirementText,
      evidence: m.evidence[0]?.text || "Direct match found in candidate profile.",
      confidence: Math.round(m.confidence * 100),
      supported: true,
      section: m.evidence[0]?.sourceSection || "Resume"
    })),
    ...atsResult.partialRequirements.map(m => ({
      requirement: m.requirementText,
      evidence: m.evidence[0]?.text || "Partial match found in candidate profile.",
      confidence: Math.round(m.confidence * 100),
      supported: true,
      section: m.evidence[0]?.sourceSection || "Resume"
    })),
    ...atsResult.missingRequirements.map(m => ({
      requirement: m.requirementText,
      evidence: "No direct candidate evidence found in indexed resume.",
      confidence: Math.round(m.confidence * 100),
      supported: false,
      section: "N/A"
    }))
  ];

  return {
    overallMatchScore: atsResult.score,
    matchedRequirements: matchedList,
    missingSkills: atsResult.missingRequirements.map(m => m.requirementText.substring(0, 60))
  };
}
