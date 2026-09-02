import { Pool, PoolConfig } from "pg";
import { ENV } from "../config/env";

let pool: Pool | null = null;
let pgVectorAvailable = false;

export function getPostgresPool(): Pool | null {
  if (!ENV.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    const config: PoolConfig = {
      connectionString: ENV.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: process.env.DATABASE_SSL === "true" || ENV.DATABASE_URL.includes("sslmode=require")
        ? { rejectUnauthorized: false }
        : undefined
    };

    pool = new Pool(config);

    pool.on("error", (err) => {
      console.error("[POSTGRES ERROR] Unexpected idle client error:", err.message);
    });
  }

  return pool;
}

export async function isPgVectorAvailable(): Promise<boolean> {
  return pgVectorAvailable;
}

export async function initPostgresSchema(): Promise<boolean> {
  const p = getPostgresPool();
  if (!p) {
    return false;
  }

  try {
    const client = await p.connect();
    try {
      console.log("🐘 [POSTGRES] Initializing relational database schema and extensions...");

      // 1. Enable pgvector extension if supported
      try {
        await client.query("CREATE EXTENSION IF NOT EXISTS vector;");
        pgVectorAvailable = true;
        console.log("✅ [POSTGRES] pgvector extension active.");
      } catch (extErr: any) {
        pgVectorAvailable = false;
        console.warn("[POSTGRES NOTE] pgvector extension not present on server, fallback cosine table will be used:", extErr.message);
      }

      // 2. Users Table
      await client.query(`
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
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `);

      // 3. User Sessions Table
      await client.query(`
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
        CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(refresh_token_hash);
      `);

      // 4. Activities Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS activities (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          activity_type TEXT NOT NULL,
          activity_name TEXT NOT NULL,
          description TEXT NOT NULL,
          metadata JSONB DEFAULT '{}',
          timestamp TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
      `);

      // 5. Interviews Table
      await client.query(`
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
        CREATE INDEX IF NOT EXISTS idx_interviews_user ON interviews(user_id);
      `);

      // 6. Resumes Table
      await client.query(`
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
        CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
      `);

      // 7. Job Applications Table
      await client.query(`
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
        CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
      `);

      // 8. Saved STAR Stories Table
      await client.query(`
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
        CREATE INDEX IF NOT EXISTS idx_star_stories_user ON star_stories(user_id);
      `);

      // 9. Admin Audit Logs Table
      await client.query(`
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

      // 10. Vector Chunks Table (pgvector or fallback array)
      const embeddingType = pgVectorAvailable ? "vector(768)" : "FLOAT8[]";
      await client.query(`
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
        CREATE INDEX IF NOT EXISTS idx_vector_chunks_user_domain ON vector_chunks(user_id, knowledge_domain);
        CREATE INDEX IF NOT EXISTS idx_vector_chunks_doc ON vector_chunks(document_id);
      `);

      // Create HNSW index if pgvector is enabled
      if (pgVectorAvailable) {
        try {
          await client.query(`
            CREATE INDEX IF NOT EXISTS idx_vector_chunks_embedding_hnsw 
            ON vector_chunks USING hnsw (embedding vector_cosine_ops);
          `);
        } catch (idxErr: any) {
          console.warn("[POSTGRES NOTE] HNSW index creation skipped:", idxErr.message);
        }
      }

      console.log("✅ [POSTGRES] Database schema verified & ready.");
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("[POSTGRES INIT ERROR]:", err.message);
    return false;
  }
}

export async function checkPostgresHealth(): Promise<{ ready: boolean; pgvector: boolean; error?: string }> {
  const p = getPostgresPool();
  if (!p) {
    return { ready: false, pgvector: false, error: "DATABASE_URL is not configured" };
  }

  try {
    const client = await p.connect();
    try {
      const res = await client.query("SELECT 1 AS connected;");
      return {
        ready: res.rows.length > 0,
        pgvector: pgVectorAvailable
      };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return { ready: false, pgvector: false, error: err.message };
  }
}

export async function closePostgresPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
