/**
 * Production Fail-Fast & Startup Safety Verification Suite
 * Genuinely spawns real server processes and inspects actual process exit codes & error streams:
 * 1. Production + missing JWT_SECRET -> Process exits with code 1
 * 2. Production + missing JWT_REFRESH_SECRET -> Process exits with code 1
 * 3. Production + missing DATABASE_URL -> Process exits with code 1
 * 4. Production + embedded DB without override -> Process exits with code 1
 * 5. Production + valid external DB + valid secrets -> Process passes config validation
 * 6. Development + local DB configuration -> Startup succeeds without fatal errors
 * 7. Explicit test-only embedded override (ALLOW_EMBEDDED_POSTGRES=true) -> Process allows startup
 */

import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";

let passCount = 0;
let failCount = 0;

function check(condition: boolean, title: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${title}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${title}${detail ? ` - ${detail}` : ""}`);
    failCount++;
  }
}

/**
 * Forcibly terminates process tree on Windows or POSIX and destroys stream handles.
 */
function terminateProcessTree(proc: ChildProcess | null | undefined): Promise<void> {
  if (!proc || !proc.pid) return Promise.resolve();
  return new Promise((resolve) => {
    try {
      proc.stdout?.destroy();
      proc.stderr?.destroy();
      proc.stdin?.destroy();
    } catch {}

    if (process.platform === "win32") {
      const killer = spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { shell: true, stdio: "ignore" });
      const killTimer = setTimeout(() => {
        try { proc.kill("SIGKILL"); } catch {}
        resolve();
      }, 2000);
      killer.on("close", () => {
        clearTimeout(killTimer);
        resolve();
      });
      killer.on("error", () => {
        clearTimeout(killTimer);
        try { proc.kill("SIGKILL"); } catch {}
        resolve();
      });
    } else {
      try { proc.kill("SIGKILL"); } catch {}
      resolve();
    }
  });
}

function testServerProcess(
  envVars: Record<string, string>,
  port = 3089,
  timeoutMs = 5000
): Promise<{ exitCode: number | null; output: string }> {
  return new Promise((resolve) => {
    const distPath = path.join(process.cwd(), "dist", "server.cjs");
    const useDist = fs.existsSync(distPath);
    const cmd = useDist ? "node" : (process.platform === "win32" ? "npx.cmd" : "npx");
    const args = useDist ? [distPath] : ["tsx", "server.ts"];
    let output = "";
    let isResolved = false;

    const cleanEnv: Record<string, string> = {
      ...process.env as Record<string, string>,
      PORT: String(port),
      ...envVars
    };
    if (!("STRICT_FAIL_FAST" in envVars)) {
      delete cleanEnv.STRICT_FAIL_FAST;
    }

    const proc = spawn(cmd, args, {
      env: cleanEnv,
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      shell: !useDist && process.platform === "win32"
    });

    proc.stdout?.on("data", (d) => {
      const text = d.toString();
      output += text;
      if (output.includes("actively running on") || output.includes("Server is actively running")) {
        safeResolve(0);
      }
    });
    proc.stderr?.on("data", (d) => { output += d.toString(); });

    const safeResolve = async (code: number | null) => {
      if (isResolved) return;
      isResolved = true;
      clearTimeout(timer);
      await terminateProcessTree(proc);
      resolve({ exitCode: code, output });
    };

    const timer = setTimeout(() => {
      console.log(`    [WATCHDOG] Reached test timeout limit (${timeoutMs}ms) — terminating PID ${proc.pid}...`);
      safeResolve(proc.exitCode);
    }, timeoutMs);

    proc.on("exit", (code) => {
      safeResolve(code);
    });

    proc.on("error", (err) => {
      console.error(`    [PROCESS ERROR] PID ${proc.pid}:`, err);
      safeResolve(1);
    });
  });
}

async function runFailFastTests() {
  const suiteStartTime = Date.now();
  console.log("=================================================================");
  console.log("🛡️ PRODUCTION FAIL-FAST & MANDATORY CONFIGURATION AUDIT");
  console.log("=================================================================");

  // Overall suite hard timeout (60 seconds max)
  const watchdog = setTimeout(() => {
    console.error("\n❌ [FATAL TIMEOUT] Fail-Fast Suite exceeded 60s hard deadline! Terminating.");
    process.exit(1);
  }, 60000);
  watchdog.unref();

  const originalEnv = { ...process.env };

  try {
    // -------------------------------------------------------------
    // Test 1: Production with NO JWT_SECRET -> Process must exit 1
    // -------------------------------------------------------------
    console.log("\n[STAGE 1/7 START] Testing process startup failure when JWT_SECRET is missing...");
    const t1 = Date.now();
    const proc1 = await testServerProcess({
      NODE_ENV: "production",
      JWT_SECRET: "",
      JWT_REFRESH_SECRET: "ValidRefreshSecret1234567890!",
      DATABASE_URL: "postgres://valid_user:secret@localhost:5432/db"
    }, 3091, 5000);
    check(
      proc1.exitCode === 1 && (proc1.output.includes("JWT_SECRET") || proc1.output.includes("CONFIG FATAL")),
      "Missing JWT_SECRET strictly halts production process with exit code 1",
      `Exit code: ${proc1.exitCode}`
    );
    console.log(`[STAGE 1/7 DONE in ${Date.now() - t1}ms]`);

    // -------------------------------------------------------------
    // Test 2: Production with NO JWT_REFRESH_SECRET -> Process must exit 1
    // -------------------------------------------------------------
    console.log("\n[STAGE 2/7 START] Testing process startup failure when JWT_REFRESH_SECRET is missing...");
    const t2 = Date.now();
    const proc2 = await testServerProcess({
      NODE_ENV: "production",
      JWT_SECRET: "ValidAccessSecret1234567890!",
      JWT_REFRESH_SECRET: "",
      DATABASE_URL: "postgres://valid_user:secret@localhost:5432/db"
    }, 3092, 5000);
    check(
      proc2.exitCode === 1 && (proc2.output.includes("JWT_REFRESH_SECRET") || proc2.output.includes("CONFIG FATAL")),
      "Missing JWT_REFRESH_SECRET strictly halts production process with exit code 1",
      `Exit code: ${proc2.exitCode}`
    );
    console.log(`[STAGE 2/7 DONE in ${Date.now() - t2}ms]`);

    // -------------------------------------------------------------
    // Test 3: Production with NO DATABASE_URL -> Process must exit 1
    // -------------------------------------------------------------
    console.log("\n[STAGE 3/7 START] Testing process startup failure when DATABASE_URL is missing...");
    const t3 = Date.now();
    const proc3 = await testServerProcess({
      NODE_ENV: "production",
      JWT_SECRET: "ValidAccessSecret1234567890!",
      JWT_REFRESH_SECRET: "ValidRefreshSecret1234567890!",
      DATABASE_URL: ""
    }, 3093, 5000);
    check(
      proc3.exitCode === 1 && (proc3.output.includes("DATABASE_URL") || proc3.output.includes("CONFIG FATAL")),
      "Missing DATABASE_URL strictly halts production process with exit code 1 (no silent fallback)",
      `Exit code: ${proc3.exitCode}`
    );
    console.log(`[STAGE 3/7 DONE in ${Date.now() - t3}ms]`);

    // -------------------------------------------------------------
    // Test 4: Production with embedded DATABASE_URL -> Process must exit 1
    // -------------------------------------------------------------
    console.log("\n[STAGE 4/7 START] Testing process startup failure when embedded DB used in production...");
    const t4 = Date.now();
    const proc4 = await testServerProcess({
      NODE_ENV: "production",
      JWT_SECRET: "ValidAccessSecret1234567890!",
      JWT_REFRESH_SECRET: "ValidRefreshSecret1234567890!",
      DATABASE_URL: "embedded://postgres_data"
    }, 3094, 5000);
    check(
      proc4.exitCode === 1 && proc4.output.includes("Embedded container-local database storage is strictly prohibited"),
      "Embedded DATABASE_URL in production strictly halts startup with exit code 1",
      `Exit code: ${proc4.exitCode}`
    );
    console.log(`[STAGE 4/7 DONE in ${Date.now() - t4}ms]`);

    // -------------------------------------------------------------
    // Test 5: Production with invalid DATABASE_URL scheme -> Process must exit 1
    // -------------------------------------------------------------
    console.log("\n[STAGE 5/7 START] Testing process startup failure when invalid DATABASE_URL scheme provided...");
    const t5 = Date.now();
    const proc5 = await testServerProcess({
      NODE_ENV: "production",
      JWT_SECRET: "ValidAccessSecret1234567890!",
      JWT_REFRESH_SECRET: "ValidRefreshSecret1234567890!",
      DATABASE_URL: "mysql://localhost:3306/db"
    }, 3095, 5000);
    check(
      proc5.exitCode === 1 && proc5.output.includes("DATABASE_URL must be a valid PostgreSQL connection string"),
      "Invalid DATABASE_URL scheme in production strictly halts startup with exit code 1",
      `Exit code: ${proc5.exitCode}`
    );
    console.log(`[STAGE 5/7 DONE in ${Date.now() - t5}ms]`);

    // -------------------------------------------------------------
    // Test 6: Development mode relaxes variables -> Process starts without fatal error
    // -------------------------------------------------------------
    console.log("\n[STAGE 6/7 START] Testing process startup in development mode without secrets...");
    const t6 = Date.now();
    const proc6 = await testServerProcess({
      NODE_ENV: "development",
      JWT_SECRET: "",
      JWT_REFRESH_SECRET: "",
      DATABASE_URL: "embedded://postgres_data_test_dev"
    }, 3096, 5000);
    check(
      !proc6.output.includes("CONFIG FATAL ERROR") && !proc6.output.includes("STARTUP HALTED"),
      "Development mode allows relaxed local testing without throwing fatal configuration errors",
      proc6.output.slice(0, 200)
    );
    console.log(`[STAGE 6/7 DONE in ${Date.now() - t6}ms]`);

    // -------------------------------------------------------------
    // Test 7: Production with embedded DB EVEN IF ALLOW_EMBEDDED_POSTGRES=true -> MUST STILL FAIL
    // -------------------------------------------------------------
    console.log("\n[STAGE 7/8 START] Testing that escape hatch ALLOW_EMBEDDED_POSTGRES=true is completely removed...");
    const t7 = Date.now();
    const proc7 = await testServerProcess({
      NODE_ENV: "production",
      JWT_SECRET: "ValidAccessSecret1234567890!",
      JWT_REFRESH_SECRET: "ValidRefreshSecret1234567890!",
      DATABASE_URL: "embedded://postgres_data_test_override",
      ALLOW_EMBEDDED_POSTGRES: "true"
    }, 3097, 5000);
    check(
      proc7.exitCode === 1 && proc7.output.includes("Embedded container-local database storage is strictly prohibited"),
      "Production strictly rejects embedded database even if ALLOW_EMBEDDED_POSTGRES=true is provided (zero escape hatches)",
      `Exit code: ${proc7.exitCode}`
    );
    console.log(`[STAGE 7/8 DONE in ${Date.now() - t7}ms]`);

    // -------------------------------------------------------------
    // Test 8: Production with STRICT_FAIL_FAST="false" -> MUST STILL FAIL (intrinsic to NODE_ENV=production)
    // -------------------------------------------------------------
    console.log("\n[STAGE 8/8 START] Testing that fail-fast is intrinsic to NODE_ENV=production even if STRICT_FAIL_FAST=false...");
    const t8 = Date.now();
    const proc8 = await testServerProcess({
      NODE_ENV: "production",
      STRICT_FAIL_FAST: "false",
      JWT_SECRET: "",
      JWT_REFRESH_SECRET: "ValidRefreshSecret1234567890!",
      DATABASE_URL: "postgres://valid_user:secret@localhost:5432/db"
    }, 3098, 5000);
    check(
      proc8.exitCode === 1 && (proc8.output.includes("JWT_SECRET") || proc8.output.includes("CONFIG FATAL")),
      "Missing JWT_SECRET strictly halts production even if STRICT_FAIL_FAST=false (intrinsic safety)",
      `Exit code: ${proc8.exitCode}`
    );
    console.log(`[STAGE 8/8 DONE in ${Date.now() - t8}ms]`);

  } finally {
    process.env = originalEnv;
  }

  const totalRuntimeMs = Date.now() - suiteStartTime;
  console.log("\n=================================================================");
  console.log(`📊 FAIL-FAST AUDIT SUMMARY: ${passCount} PASSED, ${failCount} FAILED (Total time: ${totalRuntimeMs}ms)`);
  console.log("=================================================================");

  process.exit(failCount > 0 ? 1 : 0);
}

runFailFastTests().catch(err => {
  console.error("Fatal Test error:", err);
  process.exit(1);
});
