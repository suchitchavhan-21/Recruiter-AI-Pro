# RECRUITER AI PRO — FEATURE UPDATE LOCK & PRODUCT STRATEGY FREEZE

---

## 1. Frozen Product Strategy Overview

The core architecture, tech stack, and product scope for **Recruiter AI Pro** are frozen as of baseline commit `b9cf8863f6a2b8eec4c274dfd2363198031d27ae`.

### Core Architectural Mandates:
* **Frontend**: React + TypeScript + Vite with responsive glassmorphism UI.
* **Backend**: Node.js + Express + TypeScript with modular controller/service layers.
* **Primary LLM**: Google Gemini API with Zod structured output validation.
* **Embeddings**: `gemini-embedding-2` configured to exact 768-dimensional output vectors (`outputDimensionality: 768`).
* **Production Database**: PostgreSQL 16 with `pgvector` extension for relational tables and `vector(768)` chunk storage with HNSW cosine distance indexing (`<=>`).
* **Persistence Authority**: Authoritative backend PostgreSQL storage with zero in-memory/file fallback in production mode (`NODE_ENV=production`).
* **Candidate Memory**: Durable user-scoped fact storage for skills, experience, target roles, past interview outcomes, and strengths/weaknesses.
* **Mock Interview Engine**: Bounded stateful orchestrator featuring 3 role-specialized agents:
  * **HR / Behavioral Agent**: Communication, teamwork, STAR structure, cultural fit.
  * **Technical Architect Agent**: Architecture, implementation trade-offs, scalability, failure domain isolation.
  * **Hiring Manager Agent**: Business impact, prioritization, execution velocity, stakeholder management.
* **Candidate-Private RAG**: Context-grounded semantic retrieval strictly partitioned by `userId` to eliminate cross-tenant data leakage.
* **Production Deployment**: Containerized on Google Cloud Run connecting to an external persistent PostgreSQL database.

---

## 2. Explicitly Excluded Technologies & Patterns

The following are strictly **prohibited** from being introduced:
* **MCP (Model Context Protocol)**: Prohibited.
* **Public Python Microservices**: Prohibited; all AI orchestration resides within the Node.js/TypeScript backend.
* **Unnecessary Independent Agent Deployments**: Bounded orchestration runs within the primary server process.
* **Unauthorized Database / Vector Migrations**: PostgreSQL + pgvector is the sole production database.
* **Container-Local Database in Production**: Local filesystem persistence (`data/postgres_data`) is strictly prohibited in `NODE_ENV=production`.

---

## 3. Protected Feature Areas

The canonical feature lock is defined in [`config/feature-freeze.json`](file:///C:/Users/hp/antigravity/Recruiter-AI-Pro/config/feature-freeze.json). The following functional areas are protected:

1. `authentication` — User sign-in, registration, verification, JWT generation, and session lifecycle.
2. `candidate-memory` — User-scoped durable candidate memory and fact persistence.
3. `interview-orchestrator` — Bounded adaptive turn progression, role specialization, and scoring.
4. `rag` — Section-aware chunking, tenant isolation, and pgvector semantic retrieval.
5. `embeddings` — Gemini embedding generation with 768 dimensions.
6. `resume-scanner` — Document parsing, ATS compatibility scoring, and evidence matching.
7. `database` — PostgreSQL connection pool, schema, pgvector catalog, and repositories.
8. `jobs-applications` — Job explorer and application tracking.
9. `analytics` — User interview metrics and readiness trajectory.
10. `ui-shell` — Application layout, navigation, and core routes.

---

## 4. Allowed Engineering Changes

The following changes are permitted without changing product scope:
* **Security**: CVE patches, dependency updates, vulnerability fixes.
* **Bugfixes**: Correcting logic errors, broken flows, or runtime exceptions.
* **Performance**: Query optimization, index tuning, bundle size reduction.
* **Deployment**: Cloud Run configuration, Docker build optimization, CI scripts.
* **Observability**: Health checks, structured logging, audit logs.
* **Testing**: Unit tests, integration tests, mock data suites.
* **Documentation**: Markdown guides, docstrings, schema documentation.

---

## 5. Authorized Override Mechanism

To deliberately modify a protected feature area during approved engineering milestones:

1. **Set the Override Environment Variable**:
   ```bash
   export FEATURE_FREEZE_OVERRIDE=true
   # or on Windows PowerShell:
   $env:FEATURE_FREEZE_OVERRIDE="true"
   ```
2. **Execute Build & Verification**:
   When `FEATURE_FREEZE_OVERRIDE=true` is set, `npm run verify:feature-freeze` will log an explicit audit warning and authorize the modification.
3. **Update Baseline Commit**:
   After completing the authorized modification, update `baselineCommit` in [`config/feature-freeze.json`](file:///C:/Users/hp/antigravity/Recruiter-AI-Pro/config/feature-freeze.json) to the new HEAD commit SHA.

---

## 6. CI Enforcement

The CI workflow (`.github/workflows/ci.yml`) automatically executes:
```bash
npm run lint
npm run build
npm run verify:feature-freeze
```
Any pull request or commit modifying protected features without updating the baseline commit or providing an explicit authorized override will **fail CI with exit code 1**.
