import { IVectorStore } from "./types";
import { DevVectorStore } from "./devVectorStore";
import { PgVectorStore } from "./pgVectorStore";
import { ENV } from "../../config/env";
import { checkPostgresHealth } from "../../db/postgres";

let activeVectorStore: IVectorStore | null = null;

export async function getVectorStore(): Promise<IVectorStore> {
  if (activeVectorStore) {
    return activeVectorStore;
  }

  const isProduction = (process.env.NODE_ENV === "production") || (ENV.NODE_ENV === "production");
  const dbUrl = process.env.DATABASE_URL || ENV.DATABASE_URL;

  if (dbUrl) {
    const health = await checkPostgresHealth();
    if (health.ready) {
      activeVectorStore = new PgVectorStore();
      console.log(`🚀 [VECTOR STORE] Initialized PgVectorStore (pgvector available: ${health.pgvector}).`);
      return activeVectorStore;
    } else {
      throw new Error(`[VECTOR STORE FATAL] Production is configured with DATABASE_URL but PostgreSQL is unreachable: ${health.error || "Unknown error"}. Silent in-memory fallback is strictly blocked in production.`);
    }
  } else if (isProduction) {
    throw new Error("[VECTOR STORE FATAL] DATABASE_URL is strictly required in production environment. In-memory DevVectorStore fallback is prohibited in production.");
  }

  activeVectorStore = new DevVectorStore();
  console.log("🛠️ [VECTOR STORE] Initialized DevVectorStore (in-memory cosine similarity for development/preview).");
  return activeVectorStore;
}

export function resetVectorStore(): void {
  activeVectorStore = null;
}

export * from "./types";
export { DevVectorStore, PgVectorStore };
