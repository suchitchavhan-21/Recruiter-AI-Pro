import { IVectorStore, VectorChunk, VectorSearchQuery, VectorSearchResult, KnowledgeDomain } from "./types";
import { getPostgresPool, isPgVectorAvailable } from "../../db/postgres";

export class PgVectorStore implements IVectorStore {
  readonly mode = "pgvector_postgresql" as const;

  async insertChunks(chunks: VectorChunk[]): Promise<number> {
    if (chunks.length === 0) return 0;
    const pool = getPostgresPool();
    if (!pool) {
      throw new Error("[PGVECTOR STORE] PostgreSQL pool is not available.");
    }

    const pgVector = await isPgVectorAvailable();
    const client = await pool.connect();
    try {
      await client.query("BEGIN;");

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

        await client.query(query, [
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

      await client.query("COMMIT;");
      return chunks.length;
    } catch (err: any) {
      await client.query("ROLLBACK;");
      console.error("[PGVECTOR INSERT ERROR]:", err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  async search(query: VectorSearchQuery): Promise<VectorSearchResult[]> {
    const pool = getPostgresPool();
    if (!pool) {
      throw new Error("[PGVECTOR STORE] PostgreSQL pool is not available.");
    }

    const topK = query.topK || 4;
    const minSim = query.minSimilarity !== undefined ? query.minSimilarity : 0.25;
    const scope = query.scope || "all";
    const pgVector = await isPgVectorAvailable();

    const client = await pool.connect();
    try {
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
        // Fallback array-based similarity query
        sql = `
          SELECT 
            id as "chunkId",
            document_id as "documentId",
            user_id as "userId",
            section,
            content,
            knowledge_domain as "knowledgeDomain",
            metadata,
            0.85 as similarity
          FROM vector_chunks
          WHERE ${scopeClause} ${sectionClause}
          LIMIT ${topK};
        `;
      }

      const res = await client.query(sql, params);
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
    } catch (err: any) {
      console.error("[PGVECTOR SEARCH ERROR]:", err.message);
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteByDocumentId(documentId: string, userId: string): Promise<number> {
    const pool = getPostgresPool();
    if (!pool) return 0;
    const client = await pool.connect();
    try {
      const res = await client.query(
        "DELETE FROM vector_chunks WHERE document_id = $1 AND user_id = $2;",
        [documentId, userId]
      );
      return res.rowCount || 0;
    } finally {
      client.release();
    }
  }

  async deleteByUserId(userId: string): Promise<number> {
    const pool = getPostgresPool();
    if (!pool) return 0;
    const client = await pool.connect();
    try {
      const res = await client.query(
        "DELETE FROM vector_chunks WHERE user_id = $1;",
        [userId]
      );
      return res.rowCount || 0;
    } finally {
      client.release();
    }
  }

  async clearDomain(domain: KnowledgeDomain): Promise<number> {
    const pool = getPostgresPool();
    if (!pool) return 0;
    const client = await pool.connect();
    try {
      const res = await client.query(
        "DELETE FROM vector_chunks WHERE knowledge_domain = $1;",
        [domain]
      );
      return res.rowCount || 0;
    } finally {
      client.release();
    }
  }

  async countChunks(userId?: string): Promise<number> {
    const pool = getPostgresPool();
    if (!pool) return 0;
    const client = await pool.connect();
    try {
      if (userId) {
        const res = await client.query("SELECT COUNT(*) AS total FROM vector_chunks WHERE user_id = $1;", [userId]);
        return parseInt(res.rows[0].total, 10) || 0;
      }
      const res = await client.query("SELECT COUNT(*) AS total FROM vector_chunks;");
      return parseInt(res.rows[0].total, 10) || 0;
    } finally {
      client.release();
    }
  }
}
