import { 
  retrieveCandidateEvidence as retrieveCandidateEvidenceFromRAG,
  retrieveTechnicalKnowledge as retrieveTechnicalKnowledgeFromRAG 
} from "../rag/pipeline";

export interface AgentToolResult<T = any> {
  toolName: string;
  success: boolean;
  data: T;
  error?: string;
}

/**
 * Agent tool to retrieve verified candidate evidence from the candidate's private vector space.
 */
export async function retrieveCandidateEvidence(
  userId: string,
  query: string,
  topK: number = 3
): Promise<AgentToolResult> {
  try {
    const results = await retrieveCandidateEvidenceFromRAG(userId, query, topK);
    return {
      toolName: "retrieveCandidateEvidence",
      success: true,
      data: results.map(r => ({
        section: r.section,
        content: r.content,
        similarity: r.similarity
      }))
    };
  } catch (err: any) {
    return {
      toolName: "retrieveCandidateEvidence",
      success: false,
      data: [],
      error: err.message
    };
  }
}

/**
 * Agent tool to retrieve shared system technical benchmarks and domain knowledge.
 * Aliases the imported RAG function to prevent recursive self-invocation.
 */
export async function retrieveTechnicalKnowledge(
  query: string,
  topK: number = 3
): Promise<AgentToolResult> {
  try {
    const results = await retrieveTechnicalKnowledgeFromRAG(query, topK);
    return {
      toolName: "retrieveTechnicalKnowledge",
      success: true,
      data: results.map(r => ({
        section: r.section,
        content: r.content,
        similarity: r.similarity
      }))
    };
  } catch (err: any) {
    return {
      toolName: "retrieveTechnicalKnowledge",
      success: false,
      data: [],
      error: err.message
    };
  }
}
