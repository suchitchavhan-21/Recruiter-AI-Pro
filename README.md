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
│  - Gemini LLM (@google/genai)        │     │  - Dual-Mode Repository Engine       │
│  - Embeddings (gemini-embedding-2)   │     │  - PostgreSQL Pool (Shared)          │
│  - Section-Aware RAG Pipeline        │     │  - pgvector Store (768-dim, Cosine)  │
│  - Bounded Adaptive Interview Engine │     │  - Strict Tenant Isolation           │
│  - Zero-Fabrication Evaluation       │     │  - Dev Transactional JSON Fallback   │
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
*   **AI Engine**: Server-side Google Gemini SDK (`@google/genai`) with automatic model fallback across candidate tiers (`gemini-3.7-flash`, `gemini-flash-latest`, `gemini-3.1-flash-lite`).
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

# Security Secrets (Required in Production)
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
ADMIN_PASSCODE=ADMINSECRET2026

# Embedding Model (Defaults to gemini-embedding-2)
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
# Verify TypeScript types
npm run lint

# Build production bundle
npm run build

# Start production server
npm run start
```

### 4. Run Automated Test Suite
```bash
npx tsx scripts/verify-production-suite.ts
```
