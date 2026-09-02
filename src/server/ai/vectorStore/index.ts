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

  const isProduction = ENV.NODE_ENV === "production";

  if (ENV.DATABASE_URL) {
    const health = await checkPostgresHealth();
    if (health.ready) {
      activeVectorStore = new PgVectorStore();
      console.log(`🚀 [VECTOR STORE] Initialized PgVectorStore (pgvector available: ${health.pgvector}).`);
      return activeVectorStore;
    } else {
      if (isProduction) {
        throw new Error(`[VECTOR STORE FATAL] Production is configured with DATABASE_URL but PostgreSQL is unreachable: ${health.error || "Unknown error"}. Silent in-memory fallback is blocked in production.`);
      }
      console.warn("[VECTOR STORE WARNING] PostgreSQL configured but unreachable, falling back to DevVectorStore in development mode.");
    }
  } else if (isProduction) {
    console.warn("[VECTOR STORE WARNING] Running in production without DATABASE_URL. Persistence will be file/memory scoped.");
  }

  activeVectorStore = new DevVectorStore();
  console.log("🛠️ [VECTOR STORE] Initialized DevVectorStore (in-memory cosine similarity).");
  return activeVectorStore;
}

export * from "./types";
export { DevVectorStore, PgVectorStore };
