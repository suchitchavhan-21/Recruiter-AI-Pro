/**
 * Production Fail-Fast & Startup Safety Verification Suite
 * Tests that missing mandatory production variables strictly halt server startup:
 * 1. Missing JWT_SECRET in production -> Fails startup
 * 2. Missing JWT_REFRESH_SECRET in production -> Fails startup
 * 3. Missing DATABASE_URL in production -> Fails startup
 * 4. All mandatory variables present -> Successful startup validation
 */

import { validateEnvironment } from "../src/server/config/env";

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

async function runFailFastTests() {
  console.log("=================================================================");
  console.log("🛡️ PRODUCTION FAIL-FAST & MANDATORY CONFIGURATION AUDIT");
  console.log("=================================================================");

  const originalEnv = { ...process.env };

  try {
    // -------------------------------------------------------------
    // Test 1: Production with NO JWT_SECRET -> Must FAIL
    // -------------------------------------------------------------
    process.env.NODE_ENV = "production";
    delete process.env.JWT_SECRET;
    process.env.JWT_REFRESH_SECRET = "ValidRefreshSecret1234567890!";
    process.env.DATABASE_URL = "postgres://valid_user:secret@localhost:5432/db";

    const res1 = validateEnvironment();
    check(
      !res1.valid && res1.errors.some(e => e.includes("JWT_SECRET")),
      "Missing JWT_SECRET strictly halts production startup",
      res1.errors.join("; ")
    );

    // -------------------------------------------------------------
    // Test 2: Production with NO JWT_REFRESH_SECRET -> Must FAIL
    // -------------------------------------------------------------
    process.env.JWT_SECRET = "ValidAccessSecret1234567890!";
    delete process.env.JWT_REFRESH_SECRET;
    process.env.DATABASE_URL = "postgres://valid_user:secret@localhost:5432/db";

    const res2 = validateEnvironment();
    check(
      !res2.valid && res2.errors.some(e => e.includes("JWT_REFRESH_SECRET")),
      "Missing JWT_REFRESH_SECRET strictly halts production startup",
      res2.errors.join("; ")
    );

    // -------------------------------------------------------------
    // Test 3: Production with NO DATABASE_URL -> Must FAIL
    // -------------------------------------------------------------
    process.env.JWT_SECRET = "ValidAccessSecret1234567890!";
    process.env.JWT_REFRESH_SECRET = "ValidRefreshSecret1234567890!";
    delete process.env.DATABASE_URL;

    const res3 = validateEnvironment();
    check(
      !res3.valid && res3.errors.some(e => e.includes("DATABASE_URL")),
      "Missing DATABASE_URL strictly halts production startup (no silent in-memory fallback)",
      res3.errors.join("; ")
    );

    // -------------------------------------------------------------
    // Test 4: Production with ALL mandatory variables -> Must PASS
    // -------------------------------------------------------------
    process.env.JWT_SECRET = "ValidAccessSecret1234567890!";
    process.env.JWT_REFRESH_SECRET = "ValidRefreshSecret1234567890!";
    process.env.DATABASE_URL = "postgres://valid_user:secret@localhost:5432/db";

    const res4 = validateEnvironment();
    check(
      res4.valid && res4.errors.length === 0,
      "Fully configured production environment passes configuration validation"
    );

    // -------------------------------------------------------------
    // Test 5: Development mode relaxes variables -> Must PASS
    // -------------------------------------------------------------
    process.env.NODE_ENV = "development";
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.DATABASE_URL;

    const res5 = validateEnvironment();
    check(
      res5.valid,
      "Development mode allows relaxed local testing without throwing fatal configuration errors"
    );

  } finally {
    process.env = originalEnv;
  }

  console.log("\n=================================================================");
  console.log(`📊 FAIL-FAST AUDIT SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
  console.log("=================================================================");

  if (failCount > 0) {
    process.exit(1);
  }
}

runFailFastTests();
