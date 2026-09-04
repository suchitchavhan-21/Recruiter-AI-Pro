import { Pool, PoolConfig } from "pg";
import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import path from "path";
import fs from "fs";
import { ENV } from "../config/env";

let pool: Pool | null = null;
let pgliteDb: PGlite | null = null;
let pgVectorAvailable = false;
let isInitialized = false;

/**
 * Normalizes query results across standard pg.Pool and PGlite
 */
export interface QueryResultLike {
  rows: any[];
  rowCount?: number;
}

/**
 * Returns active TCP Pool if connected, or null.
 */
export function getPostgresPool(): Pool | null {
  return pool;
}

/**
 * Returns whether pgvector extension is verified active.
 */
export async function isPgVectorAvailable(): Promise<boolean> {
  return pgVectorAvailable;
}

/**
 * Returns whether PostgreSQL is active or configured.
 */
export function isPostgresActive(): boolean {
  return Boolean(pool || pgliteDb || process.env.DATABASE_URL?.trim() || ENV.DATABASE_URL);
}

/**
 * Initializes PostgreSQL database connection (either via TCP Pool or embedded PGlite with pgvector).
 */
async function getOrInitDatabase(): Promise<{ type: "pool" | "pglite"; instance: Pool | PGlite } | null> {
  const isProd = process.env.NODE_ENV === "production" || ENV.NODE_ENV === "production";
  const dbUrl = process.env.DATABASE_URL?.trim() || ENV.DATABASE_URL || (isProd ? "" : "embedded://postgres_data");
  if (!dbUrl) {
    return null;
  }

  if (isProd && (dbUrl.includes("embedded") || dbUrl.includes("postgres_data"))) {
    throw new Error("[POSTGRES FATAL] In production mode, an external persistent PostgreSQL database (e.g. Google Cloud SQL) is required. Embedded container-local database storage is strictly prohibited.");
  }

  // 1. Try TCP PostgreSQL Pool first
  if (!dbUrl.includes("embedded") && !pgliteDb) {
    if (!pool) {
      try {
        const config: PoolConfig = {
          connectionString: dbUrl,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
          ssl: process.env.DATABASE_SSL === "true" || dbUrl.includes("sslmode=require")
            ? { rejectUnauthorized: false }
            : undefined
        };

        const testPool = new Pool(config);
        const client = await testPool.connect();
        client.release();
        pool = testPool;
        console.log("🐘 [POSTGRES] Connected to external persistent PostgreSQL instance via TCP Pool.");
        return { type: "pool", instance: pool };
      } catch (tcpErr: any) {
        if (pool) {
          try { await pool.end(); } catch {}
          pool = null;
        }

        if (isProd) {
          throw new Error(`[POSTGRES FATAL] Failed to connect to external PostgreSQL database via TCP pool: ${tcpErr.message}. Container-local fallback is prohibited in production.`);
        }
      }
    } else {
      return { type: "pool", instance: pool };
    }
  }

  // 2. In non-production environments only: fallback to embedded PGlite
  if (isProd) {
    throw new Error("[POSTGRES FATAL] In production mode, an external persistent PostgreSQL database is required. Embedded database fallback is strictly prohibited.");
  }

  if (!pgliteDb) {
    const dataDir = path.join(process.cwd(), "data", "postgres_data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    pgliteDb = new PGlite(dataDir, {
      extensions: {
        vector
      }
    });

    await pgliteDb.waitReady;
    console.log("🐘 [POSTGRES-DEV] Initialized local dev PostgreSQL + pgvector engine at data directory:", dataDir);
  }

  return { type: "pglite", instance: pgliteDb };
}

/**
 * Executes a SQL query against PostgreSQL with parameterization.
 */
export async function queryPostgres(sql: string, params?: any[]): Promise<QueryResultLike> {
  const db = await getOrInitDatabase();
  if (!db) {
    throw new Error("[POSTGRES] Database is not configured.");
  }

  if (db.type === "pool") {
    const client = await (db.instance as Pool).connect();
    try {
      const res = await client.query(sql, params);
      return { rows: res.rows, rowCount: res.rowCount || res.rows.length };
    } finally {
      client.release();
    }
  } else {
    const res = await (db.instance as PGlite).query(sql, params);
    return { rows: res.rows, rowCount: res.rows.length };
  }
}

/**
 * Initializes relational schema and pgvector extension
 */
export async function initPostgresSchema(): Promise<boolean> {
  const isProd = process.env.NODE_ENV === "production" || ENV.NODE_ENV === "production";
  const dbUrl = process.env.DATABASE_URL?.trim() || ENV.DATABASE_URL || (isProd ? "" : "embedded://postgres_data");
  if (!dbUrl) {
    return false;
  }

  try {
    const db = await getOrInitDatabase();
    if (!db) {
      return false;
    }

    console.log("🐘 [POSTGRES] Initializing PostgreSQL relational schema and vector extension...");

    // 1. Enable pgvector extension
    try {
      await queryPostgres("CREATE EXTENSION IF NOT EXISTS vector;");
      pgVectorAvailable = true;
      console.log("✅ [POSTGRES] pgvector extension active.");
    } catch (extErr: any) {
      pgVectorAvailable = false;
      console.warn("[POSTGRES NOTE] pgvector extension not present:", extErr.message);
    }

    // 2. Users Table
    await queryPostgres(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone_number TEXT,
        password_hash TEXT NOT NULL,
        profile_photo TEXT,
        role TEXT NOT NULL DEFAULT 'candidate',
        provider TEXT NOT NULL DEFAULT 'local',
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token TEXT,
        reset_password_token TEXT,
        reset_password_expires TEXT,
        last_login TEXT,
        account_status TEXT DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. User Sessions Table
    await queryPostgres(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device TEXT,
        browser TEXT,
        operating_system TEXT,
        ip_address TEXT,
        country TEXT,
        login_time TIMESTAMPTZ DEFAULT NOW(),
        logout_time TIMESTAMPTZ,
        refresh_token_hash TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMPTZ NOT NULL
      );
    `);

    // 4. Activities Table
    await queryPostgres(`
      CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        activity_name TEXT NOT NULL,
        description TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 5. Interviews Table
    await queryPostgres(`
      CREATE TABLE IF NOT EXISTS interviews (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        interviewer_count INT DEFAULT 1,
        persona TEXT DEFAULT 'mentor',
        state TEXT DEFAULT 'COMPLETED',
        score INT DEFAULT 0,
        time_taken TEXT,
        questions JSONB DEFAULT '[]',
        answers JSONB DEFAULT '[]',
        evaluation JSONB DEFAULT '{}',
        session_state JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 6. Resumes Table
    await queryPostgres(`
      CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        resume_name TEXT NOT NULL,
        file_size INT NOT NULL,
        file_mime_type TEXT NOT NULL,
        ats_score INT DEFAULT 0,
        match_score INT,
        target_role TEXT,
        parsed_content TEXT,
        analysis JSONB DEFAULT '{}',
        suggestions JSONB DEFAULT '[]',
        file_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 7. Job Applications Table
    await queryPostgres(`
      CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        role_category TEXT,
        applicant_name TEXT,
        applicant_email TEXT,
        status TEXT DEFAULT 'Screening',
        cover_letter TEXT,
        match_score INT,
        notes TEXT,
        interview_date TEXT,
        applied_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 8. Saved STAR Stories Table
    await queryPostgres(`
      CREATE TABLE IF NOT EXISTS star_stories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        company TEXT NOT NULL,
        situation TEXT NOT NULL,
        task TEXT NOT NULL,
        action TEXT NOT NULL,
        result TEXT NOT NULL,
        expert_story TEXT NOT NULL,
        title TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 9. Candidate Memories Table
    await queryPostgres(`
      CREATE TABLE IF NOT EXISTS candidate_memories (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        profile JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 10. Admin Audit Logs Table
    await queryPostgres(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        admin_user_id TEXT NOT NULL,
        admin_email TEXT NOT NULL,
        action TEXT NOT NULL,
        target_user_id TEXT,
        details TEXT NOT NULL,
        ip_address TEXT,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 11. Vector Chunks Table with vector(768)
    const embeddingType = pgVectorAvailable ? "vector(768)" : "FLOAT8[]";
    await queryPostgres(`
      CREATE TABLE IF NOT EXISTS vector_chunks (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        section TEXT,
        content TEXT NOT NULL,
        embedding ${embeddingType},
        knowledge_domain TEXT NOT NULL DEFAULT 'candidate_private',
        chunk_index INT DEFAULT 0,
        token_count INT DEFAULT 0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 11. Migration: Purge any legacy vectors created with deprecated embedding models (e.g. text-embedding-004)
    try {
      await queryPostgres(`
        DELETE FROM vector_chunks 
        WHERE metadata->>'embeddingModel' = 'text-embedding-004' 
           OR metadata->>'embeddingModel' LIKE '%004%';
      `);
    } catch {
      // Ignored if vector_chunks was just created
    }

    // 12. Shared Rate Limits Table for Multi-Instance Cloud Run Deployments
    await queryPostgres(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key VARCHAR(255) PRIMARY KEY,
        count INT NOT NULL DEFAULT 1,
        reset_at BIGINT NOT NULL
      );
    `);

    // 13. Indexes for Vector Search Performance (HNSW) & Multi-Tenant Isolation
    if (pgVectorAvailable) {
      try {
        await queryPostgres(`
          CREATE INDEX IF NOT EXISTS idx_vector_chunks_hnsw 
          ON vector_chunks USING hnsw (embedding vector_cosine_ops);
        `);
        console.log("✅ [POSTGRES] HNSW vector index active on vector_chunks(embedding vector_cosine_ops).");
      } catch (idxErr: any) {
        console.warn("[POSTGRES NOTE] HNSW index creation notice:", idxErr.message);
      }
    }

    try {
      await queryPostgres(`
        CREATE INDEX IF NOT EXISTS idx_vector_chunks_user_domain 
        ON vector_chunks (user_id, knowledge_domain);
        CREATE INDEX IF NOT EXISTS idx_vector_chunks_doc 
        ON vector_chunks (document_id);
      `);
    } catch (idxErr: any) {
      console.warn("[POSTGRES NOTE] Multi-tenant index creation notice:", idxErr.message);
    }

    isInitialized = true;
    console.log("✅ [POSTGRES] All 8 relational tables, vector_chunks, and HNSW indexes initialized successfully.");
    return true;
  } catch (err: any) {
    console.error("[POSTGRES INIT ERROR]:", err.message);
    return false;
  }
}

/**
 * Diagnostics and health check probe
 */
export async function checkPostgresHealth(): Promise<{ ready: boolean; pgvector: boolean; database: string; engine?: string; error?: string }> {
  const dbUrl = process.env.DATABASE_URL?.trim() || ENV.DATABASE_URL;
  if (!dbUrl) {
    return { ready: false, pgvector: false, database: "file_json", engine: "none", error: "DATABASE_URL is not configured" };
  }

  try {
    const res = await queryPostgres("SELECT 1 AS connected;");
    return {
      ready: res.rows.length > 0,
      pgvector: pgVectorAvailable,
      database: "postgresql",
      engine: pool ? "external_managed_postgres" : "embedded_postgres"
    };
  } catch (err: any) {
    return { ready: false, pgvector: false, database: "error", error: err.message };
  }
}

/**
 * Closes connections and pools
 */
export async function closePostgresPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
  if (pgliteDb) {
    try { await pgliteDb.close(); } catch {}
    pgliteDb = null;
  }
  isInitialized = false;
}
