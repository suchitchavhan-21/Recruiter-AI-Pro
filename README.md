# Recruiter AI Pro 🚀

An enterprise-grade, high-performance Technical Recruiter and Interview Practice Coach powered by **Google Gemini AI**. The platform facilitates adaptive mock interviews with panel simulations, evidence-based resume and job description alignment via section-aware RAG, behavioral STAR story coaching, and persistent PostgreSQL/pgvector storage with zero-fabrication evaluation rubrics.

---

### 🌐 Live Deployment & Preview
*   **Production Platform**: [https://ais-pre-7pjw7eopofiszarisybzy3-474637480139.asia-east1.run.app](https://ais-pre-7pjw7eopofiszarisybzy3-474637480139.asia-east1.run.app)

---

## 🏗️ Architecture & Tech Stack

```text
             ┌──────────────────────────────────────────────────┐
             │               React 19 SPA Client                │
             │     (TypeScript, Tailwind CSS, Motion/React)     │
             └────────────────────────┬─────────────────────────┘
                                      │  /api/* (Same-Origin)
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │             Express Security Gateway             │
             │   (OWASP Headers, JWT Auth, Sliding Rate Limit)  │
             └────────────────────────┬─────────────────────────┘
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│        AI Orchestration Layer        │     │       Data Persistence Layer         │
│  - LLM: Google Gemini                │     │  - Dual-Mode Repository Engine       │
│  - LLM Framework: LangChain          │     │  - PostgreSQL Pool (Shared)          │
│  - Embeddings (gemini-embedding-2)   │     │  - pgvector Store (768-dim, Cosine)  │
│  - LangChain RAG + BaseRetriever     │     │  - Strict Tenant Isolation           │
│  - LangChain Role-Specialized Agents │     │  - Dev Transactional JSON Fallback   │
│  - Zero-Fabrication Evaluation       │     │                                      │
└──────────────────────────────────────┘     └──────────────────────────────────────┘
```

### Frontend Architecture
*   **Core Framework**: React 19 (TypeScript) with Vite bundler.
*   **Style Layer**: **Tailwind CSS v4** featuring responsive viewports and fluid glassmorphism themes.
*   **Motion & Choreography**: Physics-inspired micro-interactions and route transitions powered by `motion/react`.
*   **Iconography**: `lucide-react`.

### Backend Architecture
*   **Server Runtime**: Node.js with Express (TypeScript), loaded dynamically with `tsx` in development, and bundled into a production CommonJS server (`dist/server.cjs`) via `esbuild`.
*   **Data Persistence**: Dual-mode storage architecture:
    *   **Production**: PostgreSQL with `pgvector` extension for ACID transactional state and 768-dimensional vector similarity search.
    *   **Development / Preview**: Thread-safe transactional JSON store with in-memory cosine vector store when `DATABASE_URL` is absent.
*   **LLM Provider**: Google Gemini (`gemini-2.5-flash`, `gemini-3.7-flash`, `gemini-flash-latest`).
*   **LLM Framework**: **LangChain** (`@langchain/core`, `@langchain/google-genai`) for runnable chains, prompt templates, structured output Zod validation, and multi-agent interview orchestration.
*   **RAG Pipeline**: LangChain `BaseRetriever` backed by PostgreSQL + `pgvector` with strict tenant scoping.
*   **Multi-Agent Orchestration**: LangChain role-specialized interview agents (**Sarah Jenkins**, **David Chen**, **Marcus Brody**).
*   **Embedding Model**: Modern `gemini-embedding-2` producing normalized 768-dimension vectors with strict runtime dimension validation.

---

## 🔒 Security Hardening & Network Protection

1. **Sliding-Window Rate Limiting**:
   * **Authentication Routes (`/api/login`, `/api/register`, etc.)**: 30 requests/minute.
   * **AI Routes (`/api/analyze-jd`, `/api/resumes`, etc.)**: 50 requests/minute.
   * **General API Routes (`/api/*`)**: 300 requests/minute.
2. **OWASP HTTP Security Headers**: `nosniff`, `SAMEORIGIN`, `1; mode=block`, and HSTS in production.
3. **Strict Tenant Isolation**: Vector queries enforce candidate boundaries (`candidate_private` vs `technical_shared`). Candidates can never retrieve another candidate's private resume vectors.
4. **Mandatory Production Secrets**: Strict validation requires `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `DATABASE_URL` in production to prevent session invalidation across container instances.

---

## 🌟 Core Features & Modules

### 1. Bounded Adaptive Interview Orchestrator
*   **Panel Personas**: 
    *   👩‍💼 **Sarah Jenkins (HR Director)**: Probes communication, teamwork, and culture alignment.
    *   👨‍💻 **David Chen (Lead Architect)**: Drills into system design, trade-offs, and scalability.
    *   👨‍💼 **Marcus Brody (VP of Engineering)**: Probes leadership, prioritization, and business impact.
*   **State Recovery**: Session state is persisted to database on every turn (`loadOrRestoreState`), allowing seamless continuation across container restarts.
*   **Bounded Progression**: Deterministic minimum turns (3), maximum turns (5), and hard upper limit (8) to prevent unbounded loops.

### 2. Section-Aware RAG Pipeline
*   **Automated Resume Indexing**: Normal resume uploads automatically parse, chunk by semantic section (Summary, Experience, Projects, Skills, Education), generate `gemini-embedding-2` vectors, and index into pgvector/dev-vector storage.
*   **Document Lifecycle**: Deleting or replacing a resume automatically removes all associated vector chunks to prevent orphaned data.
*   **Evidence-Based JD Matching**: Matches job description requirements directly against retrieved candidate resume excerpts with confidence scores and provenance.

### 3. Structured STAR Story Builder & Coach
*   Structures behavioral answers under **S**ituation, **T**ask, **A**ction, **R**esult coordinates.
*   Zero-fabrication evaluation generates model rewrites grounded in candidate context without synthetic or invented numbers.

### 4. Admin Diagnostic & Operations Portal
*   **System Diagnostics**: Live health probes for database connectivity, pgvector extension, active vector store mode, and Gemini AI status (`/api/health`).
*   **Audit Logging**: Persistent administrative event ledger tracking system actions and user events.

---

## 🚀 Quick Start Guide

### 1. Environment Configuration
Create a `.env` file in the root directory:
```env
# Required for Gemini AI Live Operations
GEMINI_API_KEY=your_gemini_api_key_here

# PostgreSQL & pgvector (Required in Production)
DATABASE_URL=postgres://user:password@localhost:5432/recruiter_ai_pro

# Security Secrets (Required in Production; min 16 characters)
JWT_SECRET=your_super_secret_jwt_key_here_minimum_16_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here_minimum_16_chars
ADMIN_PASSCODE=ADMINSECRET2026

# Model Configuration
GEMINI_PRIMARY_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODEL=gemini-flash-latest
GEMINI_LIGHT_MODEL=gemini-flash-lite-latest
EMBEDDING_MODEL=gemini-embedding-2
```

### 2. Development Run
```bash
# Start development server with Vite hot reload
npm run dev
```
Accessible at: `http://localhost:3000`

### 3. Production Build & Execution
```bash
# Verify TypeScript types (tsc --noEmit)
npm run lint

# Build production bundle (client + bundled CommonJS server)
npm run build

# Start production server (node dist/server.cjs)
npm run start
```

### 4. Realistic Avatar & Google Cloud Voice Architecture
*   **Speech Synthesis (TTS)**:
    *   **Provider**: `GoogleCloudTTSProvider` using official Google Cloud Text-to-Speech REST API (`https://texttospeech.googleapis.com/v1/text:synthesize`) with high-fidelity Neural2 persona voices:
        *   Sarah Jenkins -> `en-US-Neural2-F` (en-US female)
        *   David Chen -> `en-US-Neural2-D` (en-US male)
        *   Marcus Brody -> `en-GB-Neural2-B` (en-GB male)
    *   **Offline / Test Mode**: `MockTTSProvider` generates standard-compliant MPEG Layer 3 audio frames offline without external network dependency.
    *   **Security & Privacy**: `Cache-Control: private, no-cache, no-store` prevents caching sensitive interview questions.
    *   **Input Limits**: Maximum 1,000 characters per request, bounded by `AbortSignal.timeout(8000)` and rate-limited to 60 req/min.
*   **Realistic Avatar Engine**:
    *   **Face Tracking**: Browser-local `@mediapipe/tasks-vision` Face Landmarker extracting 468 facial landmarks.
    *   **Facial Deformation**: Dense Delaunay triangulation mesh deformation rendered on HTML5 canvas.
    *   **Audio-Driven Animation**: Live audio analysis via Web Audio API `AnalyserNode` acoustic energy and spectral centroid drives real-time canvas mesh dynamics (not pre-rendered phoneme/viseme timing lookup).

### 5. Ethical Decision Support & Grounding Rubrics
*   **AI-Assisted Hiring Decision Support**: This system is designed solely to support and augment human recruiting decisions. All AI scores and interview feedback are evidence-grounded recommendations; human hiring managers retain full decision-making responsibility.
*   **Programmatic Evidence Grounding**: Evaluation claims are programmatically validated against verbatim transcript turns to verify quotes and compute grounding ratios, strictly penalizing ungrounded claims.

### 6. Automated Verification & Test Suites
```bash
# Verify TypeScript types (tsc --noEmit)
npm run lint

# Build production bundle (client + bundled CommonJS server)
npm run build

# Multi-Tenant Boundary & Security Isolation Test (15 checks)
npm run test:security

# Real Browser End-to-End Automation via Microsoft Edge (22 checks)
npm run test:browser

# Full Candidate Lifecycle End-to-End Suite with Hiring Thresholds (31 checks)
npm run test:e2e

# Deterministic ATS Scoring & Jobs Persistence Suite (33 checks)
npm run test-jobs-and-ats

# Database & Cross-Process Persistence Verification (14 checks)
npm run test:db-persistence

# LangChain Orchestration, Evidence Grounding & Concurrency Suite (25 checks)
npm run test:langchain

# Empirical RAG Retrieval Quality Benchmark Suite (Recall@K, MRR)
npm run test:rag

# Feature-Freeze Integrity & Lock Regression Suite (14 checks)
npm run test:feature-freeze

# Deterministic Persona Voice & TTS Privacy Suite (12 checks)
npm run test:voice

# Production Fail-Fast & Startup Process Safety Audit (7 checks)
npm run verify-production-fail-fast

# Comprehensive Production Verification (35 checks, PostgreSQL, pgvector, multi-tenant, process restart)
npm run verify:production
```
