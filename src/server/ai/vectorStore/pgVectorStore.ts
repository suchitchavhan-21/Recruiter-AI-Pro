import { IVectorStore, VectorChunk, VectorSearchQuery, VectorSearchResult, KnowledgeDomain } from "./types";
import { queryPostgres, isPgVectorAvailable } from "../../db/postgres";

export class PgVectorStore implements IVectorStore {
  readonly mode = "pgvector" as const;

  async insertChunks(chunks: VectorChunk[]): Promise<number> {
    if (chunks.length === 0) return 0;
    const pgVector = await isPgVectorAvailable();

    for (const chunk of chunks) {
      const embeddingParam = pgVector
        ? `[${chunk.embedding.join(",")}]`
        : chunk.embedding;

      const query = `
        INSERT INTO vector_chunks (
          id, document_id, user_id, section, content, embedding, 
          knowledge_domain, chunk_index, token_count, metadata, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content,
          embedding = EXCLUDED.embedding,
          section = EXCLUDED.section,
          metadata = EXCLUDED.metadata,
          updated_at = NOW();
      `;

      await queryPostgres(query, [
        chunk.id,
        chunk.documentId,
        chunk.userId,
        chunk.section,
        chunk.content,
        embeddingParam,
        chunk.knowledgeDomain,
        chunk.chunkIndex,
        chunk.tokenCount,
        JSON.stringify(chunk.metadata || {})
      ]);
    }

    return chunks.length;
  }

  async search(query: VectorSearchQuery): Promise<VectorSearchResult[]> {
    const topK = query.topK || 4;
    const minSim = query.minSimilarity !== undefined ? query.minSimilarity : 0.25;
    const scope = query.scope || "all";
    const pgVector = await isPgVectorAvailable();

    let scopeClause = "";
    const params: any[] = [];
    let paramIdx = 1;

    if (scope === "candidate_private") {
      scopeClause = `user_id = $${paramIdx} AND knowledge_domain = 'candidate_private'`;
      params.push(query.userId);
      paramIdx++;
    } else if (scope === "technical_shared") {
      scopeClause = `knowledge_domain IN ('technical_shared', 'curriculum_benchmark')`;
    } else {
      scopeClause = `(user_id = $${paramIdx} OR knowledge_domain IN ('technical_shared', 'curriculum_benchmark'))`;
      params.push(query.userId);
      paramIdx++;
    }

    let sectionClause = "";
    if (query.section) {
      sectionClause = ` AND LOWER(section) = LOWER($${paramIdx})`;
      params.push(query.section);
      paramIdx++;
    }

    let sql = "";
    if (pgVector) {
      const embeddingVectorStr = `[${query.queryVector.join(",")}]`;
      params.push(embeddingVectorStr);
      const vectorParamIdx = paramIdx;
      paramIdx++;

      // 1 - (embedding <=> queryVector) computes cosine similarity
      sql = `
        SELECT 
          id as "chunkId",
          document_id as "documentId",
          user_id as "userId",
          section,
          content,
          knowledge_domain as "knowledgeDomain",
          metadata,
          (1 - (embedding <=> $${vectorParamIdx}::vector)) as similarity
        FROM vector_chunks
        WHERE ${scopeClause} ${sectionClause}
          AND (1 - (embedding <=> $${vectorParamIdx}::vector)) >= ${minSim}
        ORDER BY (embedding <=> $${vectorParamIdx}::vector) ASC
        LIMIT ${topK};
      `;
    } else {
      // Safe degraded mode: When pgvector extension is not installed in database, return empty results
      // NEVER fabricate synthetic similarity scores (e.g. 0.85).
      console.warn("[VECTOR STORE NOTICE] pgvector extension is not installed; vector search safely degraded to 0 results.");
      return [];
    }

    const res = await queryPostgres(sql, params);
    return res.rows.map((row: any) => ({
      chunkId: row.chunkId,
      documentId: row.documentId,
      userId: row.userId,
      section: row.section || "",
      content: row.content,
      similarity: parseFloat(row.similarity) || 0,
      knowledgeDomain: row.knowledgeDomain,
      metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : (row.metadata || {})
    }));
  }

  async deleteByDocumentId(documentId: string, userId: string): Promise<number> {
    const res = await queryPostgres(
      "DELETE FROM vector_chunks WHERE document_id = $1 AND user_id = $2;",
      [documentId, userId]
    );
    return res.rowCount || 0;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const res = await queryPostgres(
      "DELETE FROM vector_chunks WHERE user_id = $1;",
      [userId]
    );
    return res.rowCount || 0;
  }

  async clearDomain(domain: KnowledgeDomain): Promise<number> {
    const res = await queryPostgres(
      "DELETE FROM vector_chunks WHERE knowledge_domain = $1;",
      [domain]
    );
    return res.rowCount || 0;
  }

  async countChunks(userId?: string): Promise<number> {
    if (userId) {
      const res = await queryPostgres("SELECT COUNT(*) AS total FROM vector_chunks WHERE user_id = $1;", [userId]);
      return parseInt(res.rows[0].total, 10) || 0;
    }
    const res = await queryPostgres("SELECT COUNT(*) AS total FROM vector_chunks;");
    return parseInt(res.rows[0].total, 10) || 0;
  }
}
