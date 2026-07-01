# Interview Coach AI 🚀

An interactive, full-stack Technical Recruiter and Interview Practice Coach powered by **Google Gemini AI**. This platform simulates highly realistic behavioral and technical interviews, evaluates candidate responses with extreme precision, provides custom coaching, and includes a comprehensive administrative portal with live diagnostics and automated test suites.

---

## 🎨 Visual Identity & Architecture

Interview Coach AI is built as a highly responsive, modern, and dark-themed single-page application. It relies on a modular, type-safe full-stack layout designed to scale gracefully.

- **Frontend**: React 19 (TypeScript), configured with Vite, styled natively with **Tailwind CSS v4** utilities, incorporating rich physics-inspired micro-animations via `motion/react`, and featuring elegant iconography from `lucide-react`.
- **Backend**: Node.js & Express.js (TypeScript), running via `tsx` in development mode, and compiled into a single, bundled production package inside `dist/server.cjs` using `esbuild` for ultra-fast load times.
- **AI Core**: Powered by the modern, server-side `@google/genai` SDK, keeping all Gemini API operations secure and hidden from the browser client.

---

## 🌟 Key Functional Pillars

### 1. Multi-User Candidate Profile Registry
Candidates can construct and switch between customized profiles, choosing their preferred title (e.g., Systems Architect, Product Manager, SRE), custom email registrations, and unique avatar emojis. The platform tracks session records and evaluations unique to each registered profile.

### 2. Candidate Practice Workspace (The 4-Phase Lifecycle)
The workspace guides candidates step-by-step through a state-of-the-art interview preparation flow:
*   **Phase 1: Configure Role & Job Description (`PHASE1_INPUT`)**: Candidates provide target Job Descriptions (JD) and company names (e.g., Google, Netflix, Stripe) to align mock metrics.
*   **Phase 1: Industry Research Summary (`PHASE1_SUMMARY`)**: Gemini AI acts as a researcher, parsing the Job Description to extract target skills, technical requirements, typical interview questions, and key expectations.
*   **Phase 2: Live Mock Interview (`PHASE2_INTERVIEW`)**: Simulates a live interview. 
    *   Features real-time speech-to-text input utilizing browser-native Speech Recognition APIs.
    *   Tracks and tallies "filler words" (e.g., *"um"*, *"ah"*, *"like"*, *"you know"*) in real-time to train speech discipline.
    *   Records full mock answer transcripts question-by-question.
*   **Phase 3: AI-Driven Performance Assessment (`PHASE3_FEEDBACK`)**: Submits full transcripts to the evaluation endpoint. Gemini assesses answers qualitatively, returning an analytical scorecard including overall proficiency grades, exact filler counts, identified technical gaps, and actionable revision templates.
*   **Phase 4: Behavioral Coaching Engine (`PHASE4_COACHING`)**: Enables an open-dialogue chat where candidates can query the AI Recruiter directly on specific performance dimensions, requesting mock question alternatives or target guidelines.

### 3. Interactive STAR Story Builder
A dedicated workspace for preparing high-impact behavioral answers. Candidates input their story utilizing the structured **STAR** model (**S**ituation, **T**ask, **A**ction, **R**esult). The AI evaluates story impact, scores technical depth out of 100, and outputs a refined, recruiter-optimized narrative.

### 4. Administrative System & Operations Monitor (`AdminPortal`)
A protected dashboard designed for recruiters, SREs, and platform managers to monitor live platform activity:
*   **Gated Entry**: Restricts access automatically to the pre-authorized master administrator email (`suchitchavhan889@gmail.com`) or falls back to secure local passcode credentials.
*   **System Counters**: Real-time counts of database records (users, active sessions, and event ledger logs).
*   **Live Activity Ledger**: An active terminal stream of platform operations (e.g., mock interview submissions, STAR creations). Includes advanced filters by Candidate, Event Type, and search keywords.
*   **Integration Test Suite (Automated Diagnostics)**: Contains executable unit-and-integration verification subroutines:
    1.  *API Connection Check*: Asserts status code integrity of endpoints (`/api/users` and `/api/activities`).
    2.  *Database Write Integrity*: Registers a simulated candidate to confirm DB writes work properly.
    3.  *Database Cleanup & Deletion*: Cleans up the simulated user to assert DELETE operations.
    4.  *Activity Stream Consistency*: Validates ledger writes for real-time reporting.
    5.  *Gemini Engine Connection Probe*: Verifies end-to-end handshake speeds and JSON output parsing of the Google Gemini API.
*   **System Controllers (Pipeline Simulator)**:
    *   **Seed Database Reset**: Purges modifications and restores the database back to clean, pre-seeded candidate rows.
    *   **Stress-Test Profiles Injector**: Spawns 5 parallel candidate profiles (DevOps, UX, AI Specialist, etc.) to stress-test UI layout rendering and sorting.
    *   **Live Traffic Simulator**: Automatically posts randomized client events to the logger every 3 seconds to emulate active candidate traffic.
    *   **Error Boundary Probe**: Verifies application containment by targeting intentionally broken routes.

---

## 🛠️ Configuration & Secrets

The application operates securely by isolating API keys on the server.

### Environment Variable Requirement
Create a `.env` file in the root directory:
```env
# Google Gemini API key required for LLM Evaluations & Coaching
GEMINI_API_KEY=your_gemini_api_key_here
```

*Note: In development and production, the backend automatically reads this key at startup and initializes the `GoogleGenAI` SDK safely.*

---

## 🚀 Pushing to GitHub

To store and manage your code repository on GitHub, perform the following steps inside your terminal:

1.  **Initialize Git**:
    ```bash
    git init
    ```
2.  **Add Files to Staging**:
    ```bash
    git add .
    ```
3.  **Commit the Changes**:
    ```bash
    git commit -m "feat: complete Interview Coach AI app with automated diagnostic suite"
    ```
4.  **Create Repository on GitHub**:
    Go to [GitHub](https://github.com), sign in, and create a new repository. Copy the remote URL.
5.  **Link and Push**:
    ```bash
    git remote add origin <your_github_repo_url>
    git branch -M main
    git push -u origin main
    ```

*Tip: You can also use the **Export to GitHub** flow directly in your AI Studio editor settings panel to link and push your workspace with a single click!*

---

## 📦 Production Build & Deployments

The platform builds and runs inside secure Google Cloud Run containers. Follow these instructions to compile and start the full-stack system:

### Standard Build Script
Our workspace incorporates an automated custom build engine. Running the compile command performs both frontend client generation and server bundling:
```bash
npm run build
```
This produces:
*   A static React Single-Page Application inside `dist/`.
*   A compiled, self-contained CommonJS server file at `dist/server.cjs` via `esbuild`.

### Local Developer Execution
To launch the Node development server in live-reload mode:
```bash
npm run dev
```
The developer server binds to host `0.0.0.0` and port `3000` to handle reverse-proxy routing.

### Production Production Run
Once built, launch the compiled full-stack environment natively in Node:
```bash
npm run start
```

---

## 🧬 Diagnostic Integrity Details
The automated diagnostics module uses high-resolution browserside `performance.now()` measurements to track latency for each integration check. The subroutines output detailed steps inside the expandable diagnostic logger, catching and containing errors gracefully without halting client execution.
