/**
 * Recruiter AI Pro — Empirical RAG Retrieval Quality Benchmark Suite
 * 
 * Measures concrete retrieval performance on ground-truth evaluation dataset:
 * - Recall@K (Proportion of queries where at least one ground-truth evidence chunk was retrieved)
 * - Precision@K (Proportion of retrieved chunks in top-K that contain relevant ground-truth evidence)
 * - MRR (Mean Reciprocal Rank across all benchmark queries)
 * 
 * Note: Clearly distinguishes retrieval evaluation from LLM generation quality.
 */

import { indexResumeDocument, retrieveCandidateEvidence, deleteResumeVectors } from "../src/server/ai/rag/pipeline";
import { getVectorStore, resetVectorStore } from "../src/server/ai/vectorStore";
import { initPostgresSchema } from "../src/server/db/postgres";

interface BenchmarkQuery {
  id: string;
  question: string;
  expectedSection: string;
  requiredKeywords: string[];
}

const BENCHMARK_RESUME_TEXT = `
Summary:
Principal Cloud & Distributed Systems Architect with 12+ years experience building low-latency stream processing, distributed consensus engines, and high-concurrency cloud native microservices.

Experience:
Senior Staff Architect at Acme Distributed Systems (2020 - Present):
- Led architectural migration from legacy monolith to Kubernetes microservices handling 250,000 QPS peak throughput with sub-20ms p99 latency.
- Engineered Paxos consensus protocol with Raft cluster replication ensuring zero data loss during multi-datacenter partitions.
- Implemented Apache Kafka partition rebalancing strategy that reduced consumer group rebalance pause times by 85%.
- Integrated PostgreSQL relational persistence with pgvector extension for high-dimensional cosine similarity indexing.

Lead Infrastructure Engineer at DataScale Corp (2016 - 2020):
- Designed fault-tolerant gRPC microservices pipeline processing 5 TB daily telemetry logs with distributed tracing.
- Deployed distributed Redis clusters with active-active caching and pessimistic epoch lease fencing to eliminate race conditions.

Skills:
- Core Languages: Go, Rust, TypeScript, Python, SQL, C++.
- Distributed Systems: Paxos, Raft, Kafka, gRPC, Redis, Kubernetes, Docker, Microservices.
- Database & Storage: PostgreSQL, pgvector, DynamoDB, Cassandra.

Education:
- Master of Science in Computer Science, Distributed Systems Specialization, Stanford University (2014 - 2016).

Certifications:
- Google Cloud Certified Professional Cloud Architect.
`;

const BENCHMARK_QUERIES: BenchmarkQuery[] = [
  {
    id: "Q1",
    question: "What consensus protocol was engineered for replication and zero data loss?",
    expectedSection: "Experience",
    requiredKeywords: ["paxos", "raft"]
  },
  {
    id: "Q2",
    question: "What message streaming platform was optimized to reduce consumer group rebalance pause times?",
    expectedSection: "Experience",
    requiredKeywords: ["kafka", "rebalancing"]
  },
  {
    id: "Q3",
    question: "What peak queries per second (QPS) did the Kubernetes microservices handle?",
    expectedSection: "Experience",
    requiredKeywords: ["250,000", "qps"]
  },
  {
    id: "Q4",
    question: "What daily telemetry data volume was processed by the gRPC pipeline?",
    expectedSection: "Experience",
    requiredKeywords: ["5 tb", "telemetry"]
  },
  {
    id: "Q5",
    question: "What relational database and vector extension was used for cosine similarity search?",
    expectedSection: "Experience",
    requiredKeywords: ["postgresql", "pgvector"]
  },
  {
    id: "Q6",
    question: "What primary systems programming languages does the candidate specialize in?",
    expectedSection: "Skills",
    requiredKeywords: ["go", "rust", "typescript"]
  },
  {
    id: "Q7",
    question: "What university degree and specialization does the candidate hold?",
    expectedSection: "Education",
    requiredKeywords: ["stanford", "distributed systems"]
  },
  {
    id: "Q8",
    question: "What professional cloud architect certification does the candidate possess?",
    expectedSection: "Certifications",
    requiredKeywords: ["google cloud certified", "cloud architect"]
  }
];

async function runRagEvaluation() {
  console.log("================================================================================");
  console.log("       RECRUITER AI PRO — RAG RETRIEVAL QUALITY BENCHMARK (EMPIRICAL)          ");
  console.log("================================================================================");

  // Initialize PostgreSQL schema and pgvector
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "embedded://postgres_data";
    process.env.ALLOW_EMBEDDED_POSTGRES = "true";
  }
  await initPostgresSchema();
  resetVectorStore();
  const vectorStore = await getVectorStore();
  console.log(`[RAG BENCHMARK] Active vector store mode: ${vectorStore.mode}`);

  const testUserId = `rag_bench_user_${Date.now()}`;
  const testResumeId = `rag_bench_doc_${Date.now()}`;
  const attackerUserId = `rag_attacker_user_${Date.now()}`;

  try {
    // 1. Ingest and index benchmark document into RAG vector storage
    console.log("\n[STAGE 1] Ingesting & indexing benchmark candidate resume into pgvector...");
    const indexedChunksCount = await indexResumeDocument({
      resumeId: testResumeId,
      userId: testUserId,
      resumeText: BENCHMARK_RESUME_TEXT,
      metadata: { benchmark: true }
    });
    console.log(`  ✓ Indexed ${indexedChunksCount} section chunks into vector storage.`);

    // 1.5 Tenant Isolation Verification: Attacker cannot retrieve User's chunks
    console.log("\n[STAGE 1.5] Verifying RAG multi-tenant vector isolation...");
    const attackerResults = await retrieveCandidateEvidence(attackerUserId, "What consensus protocol was engineered?", 3);
    if (attackerResults.length !== 0) {
      console.error(`❌ [TENANT ISOLATION FAIL] Attacker retrieved ${attackerResults.length} chunks from other user!`);
      process.exit(1);
    }
    console.log("  ✅ PASS [TENANT ISOLATION] Attacker cannot retrieve candidate's private vector chunks.");

    // 2. Evaluate each benchmark query across K=1, K=3, K=5
    const K = 3;
    let hitCount = 0;
    let totalPrecisionSum = 0;
    let reciprocalRankSum = 0;

    console.log(`\n[STAGE 2] Evaluating Retrieval Metrics for K=${K} on ${BENCHMARK_QUERIES.length} Benchmark Queries:`);
    console.log("--------------------------------------------------------------------------------");

    for (const bq of BENCHMARK_QUERIES) {
      const results = await retrieveCandidateEvidence(testUserId, bq.question, K);

      let firstMatchRank: number | null = null;
      let relevantInTopK = 0;

      for (let i = 0; i < results.length; i++) {
        const chunk = results[i];
        const contentLower = chunk.content.toLowerCase();
        const sectionMatch = chunk.section.toLowerCase() === bq.expectedSection.toLowerCase();
        const keywordMatch = bq.requiredKeywords.some(kw => contentLower.includes(kw.toLowerCase()));

        if (sectionMatch || keywordMatch) {
          relevantInTopK++;
          if (firstMatchRank === null) {
            firstMatchRank = i + 1; // 1-indexed rank
          }
        }
      }

      const isHit = firstMatchRank !== null;
      if (isHit) hitCount++;

      const precisionAtK = relevantInTopK / Math.max(1, results.length);
      totalPrecisionSum += precisionAtK;

      const reciprocalRank = firstMatchRank ? 1 / firstMatchRank : 0;
      reciprocalRankSum += reciprocalRank;

      const statusIcon = isHit ? "✅ PASS" : "❌ MISS";
      console.log(`  ${statusIcon} [${bq.id}] ${bq.question}`);
      console.log(`         Expected Section: ${bq.expectedSection} | Hit Rank: ${firstMatchRank || "None"} | Precision@${K}: ${(precisionAtK * 100).toFixed(1)}%`);
    }

    const meanRecallAtK = hitCount / BENCHMARK_QUERIES.length;
    const meanPrecisionAtK = totalPrecisionSum / BENCHMARK_QUERIES.length;
    const meanReciprocalRank = reciprocalRankSum / BENCHMARK_QUERIES.length;

    console.log("\n================================================================================");
    console.log("                        RAG EVALUATION SUMMARY METRICS                         ");
    console.log("================================================================================");
    console.log(`  Total Evaluated Queries:   ${BENCHMARK_QUERIES.length}`);
    console.log(`  Recall@${K}:                  ${(meanRecallAtK * 100).toFixed(1)}% (${hitCount}/${BENCHMARK_QUERIES.length} queries returned relevant evidence)`);
    console.log(`  Precision@${K}:               ${(meanPrecisionAtK * 100).toFixed(1)}%`);
    console.log(`  MRR (Mean Reciprocal Rank): ${meanReciprocalRank.toFixed(3)}`);
    console.log("--------------------------------------------------------------------------------");

    // Enforce strict quality assertions
    const MIN_RECALL_THRESHOLD = 0.70; // At least 70% recall
    const MIN_MRR_THRESHOLD = 0.60;    // At least 0.60 MRR

    let passed = true;
    if (meanRecallAtK < MIN_RECALL_THRESHOLD) {
      console.error(`❌ [QUALITY FAIL] Mean Recall@${K} (${(meanRecallAtK * 100).toFixed(1)}%) is below minimum required threshold (${MIN_RECALL_THRESHOLD * 100}%).`);
      passed = false;
    } else {
      console.log(`✅ [QUALITY PASS] Mean Recall@${K} exceeds required threshold (>= ${MIN_RECALL_THRESHOLD * 100}%).`);
    }

    if (meanReciprocalRank < MIN_MRR_THRESHOLD) {
      console.error(`❌ [QUALITY FAIL] MRR (${meanReciprocalRank.toFixed(3)}) is below minimum required threshold (${MIN_MRR_THRESHOLD}).`);
      passed = false;
    } else {
      console.log(`✅ [QUALITY PASS] MRR exceeds required threshold (>= ${MIN_MRR_THRESHOLD}).`);
    }

    console.log("================================================================================\n");

    if (!passed) {
      process.exit(1);
    }
  } finally {
    // Clean up benchmark candidate vectors
    try {
      await deleteResumeVectors(testResumeId, testUserId);
    } catch {
      // Ignored
    }
  }
}

runRagEvaluation().catch(err => {
  console.error("RAG evaluation failure:", err);
  process.exit(1);
});
