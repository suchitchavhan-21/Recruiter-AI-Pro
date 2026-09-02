# RECRUITER AI PRO — TECHNICAL FEATURE UPDATE LOCK & PRODUCT STRATEGY FREEZE

---

## 1. Frozen Product Strategy Overview

The core architecture, tech stack, and product scope for **Recruiter AI Pro** are permanently frozen as of baseline commit `abdae893df1915830693866c528bc36b5168cf1a`.

### A. Certified Core Architecture:
* **Frontend**: React 19 + TypeScript + Vite with responsive glassmorphism UI.
* **Backend**: Node.js + Express + TypeScript with modular controller/repository architecture.
* **Primary LLM**: Google Gemini API (`@google/genai`) with Zod runtime schema validation.
* **Embeddings**: `gemini-embedding-2` configured to exact 768-dimensional output vectors (`outputDimensionality: 768`).
* **Production Database**: PostgreSQL 16 with `pgvector` extension for 8 relational tables and `vector(768)` chunk storage with HNSW cosine distance indexing (`<=>`).
* **Persistence Authority**: Authoritative backend PostgreSQL storage with zero in-memory/file fallback in production mode (`NODE_ENV=production`).
* **Candidate Memory**: Durable user-scoped fact storage (`candidate_memories` table) for skills, experience, target roles, past interview outcomes, strengths, weaknesses, and readiness signals.
* **Mock Interview Engine**: Bounded stateful orchestrator featuring 3 role-specialized agents:
  * **HR / Behavioral Agent** (`Sarah Jenkins`): Communication, teamwork, STAR structure, cultural fit.
  * **Technical Architect Agent** (`David Chen`): System architecture, fault tolerance, concurrency, database bottlenecks, trade-offs.
  * **Hiring Manager Agent** (`Marcus Brody`): Business impact, prioritization, delivery ownership, technical debt vs velocity.
* **Candidate-Private RAG**: Context-grounded semantic retrieval strictly partitioned by `userId` to eliminate cross-tenant data leakage.
* **Production Hard-Fail Guardrail**: Container-local filesystem persistence (`./data/postgres_data` / PGlite) is **strictly rejected** in `NODE_ENV=production`. External TCP/SSL managed PostgreSQL is required.

---

## 2. Explicitly Excluded Technologies & Anti-Patterns

The following are strictly **prohibited** from being introduced:
* **MCP (Model Context Protocol)**: Prohibited.
* **Public Python Microservices**: Prohibited; all AI orchestration resides within the Node.js/TypeScript backend.
* **Unnecessary Independent Agent Deployments**: Prohibited; bounded orchestration runs within the primary server process.
* **Unauthorized Database / Vector Migrations**: PostgreSQL + pgvector is the sole production database.
* **Container-Local Database in Production**: Local filesystem persistence (`data/postgres_data`) is strictly prohibited in `NODE_ENV=production`.

---

## 3. Protected Feature Areas & Paths

The canonical lock definition is defined in [`config/feature-freeze.json`](file:///C:/Users/hp/antigravity/Recruiter-AI-Pro/config/feature-freeze.json). The following functional areas and paths are strictly protected:

1. `authentication`:
   * `src/server/controllers/auth.controller.ts`
   * `src/server/routes/auth.routes.ts`
   * `src/server/middleware/auth.ts`
   * `src/features/auth`
   * `src/components/auth`
2. `candidate-memory`:
   * `src/server/ai/memory`
   * `src/server/db/schema.ts`
3. `interview-orchestrator`:
   * `src/server/ai/orchestrator`
   * `src/server/controllers/interview.controller.ts`
   * `src/server/routes/interview.routes.ts`
   * `src/components/ActiveInterview.tsx`
   * `src/components/InterviewWizard.tsx`
   * `src/components/FeedbackReport.tsx`
4. `rag`:
   * `src/server/ai/rag`
   * `src/server/ai/vectorStore`
5. `embeddings`:
   * `src/server/ai/embeddings`
6. `resume-scanner`:
   * `src/server/controllers/resume.controller.ts`
   * `src/server/routes/resume.routes.ts`
   * `src/server/services/fileParser.service.ts`
   * `src/components/EnterpriseResumeScanner.tsx`
7. `database`:
   * `src/server/db`
8. `jobs-applications`:
   * `src/server/controllers/jobs.controller.ts`
   * `src/server/routes/jobs.routes.ts`
   * `src/components/JobsExplorer.tsx`
9. `analytics`:
   * `src/server/controllers/analytics.controller.ts`
   * `src/server/routes/analytics.routes.ts`
   * `src/components/AnalyticsView.tsx`
10. `ui-shell`:
    * `src/App.tsx`
    * `src/components/Header.tsx`
    * `src/components/Sidebar.tsx`
    * `src/components/BottomNav.tsx`

---

## 4. How the Lock Verifier Works (Deterministic Engine)

The verification script [`scripts/verify-feature-freeze.ts`](file:///C:/Users/hp/antigravity/Recruiter-AI-Pro/scripts/verify-feature-freeze.ts) executes deterministic checks:

1. **Baseline Commit Existence**: Validates that `baselineCommit` is an authentic 40-character hexadecimal SHA in the Git commit graph using `git cat-file -t <SHA>`.
2. **Diff Calculation**:
   * Evaluates all committed and uncommitted file modifications against the baseline commit: `git diff --name-only <baselineCommit>`.
   * Evaluates untracked and renamed files via `git status --porcelain`.
3. **Path Normalization & False-Positive Immunity**:
   * All paths are normalized (lowercased, forward slashes, clean prefixes).
   * Exact file matches (`cleanPath(file) === cleanPath(protectedPath)`) and directory subtrees (`cleanPath(file).startsWith(cleanPath(protectedPath) + "/")`) are detected.
   * Similar-but-unrelated paths (e.g. `src/components/author_card` vs `src/components/auth`) are immune from false positives.
4. **Allowed Non-Feature Exceptions**:
   * Files in `.github/`, `scripts/`, `tests/`, `config/feature-freeze.json`, `FEATURE_FREEZE.md`, `README.md`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, and `.env.example` are classified as allowed engineering/tooling changes and pass automatically.

---

## 5. Authorized Override Semantics

To deliberately modify a protected feature area during approved engineering iterations:

1. **Set Strict Environment Variable**:
   ```bash
   export FEATURE_FREEZE_OVERRIDE=true
   # or on Windows PowerShell:
   $env:FEATURE_FREEZE_OVERRIDE="true"
   ```
2. **Override Validation**:
   * Only the exact string value `"true"` is accepted. Fuzzy truthy values (`"TRUE"`, `"true "`, `"1"`, `"yes"`) are strictly rejected.
   * When authorized, the verifier emits an explicit audit log with timestamp, process ID, and environment variable confirmation.
3. **Sealing Future Releases**:
   * After completing approved modifications, update `baselineCommit` in [`config/feature-freeze.json`](file:///C:/Users/hp/antigravity/Recruiter-AI-Pro/config/feature-freeze.json) to the new HEAD commit SHA.

---

## 6. CI Enforcement

The CI workflow ([`.github/workflows/ci.yml`](file:///C:/Users/hp/antigravity/Recruiter-AI-Pro/.github/workflows/ci.yml)) automatically executes on all pull requests and pushes:
```bash
npm run lint
npm run build
npm run verify:feature-freeze
npm run test:feature-freeze
```
Any pull request modifying protected features without an authorized override will fail CI with exit code 1.
