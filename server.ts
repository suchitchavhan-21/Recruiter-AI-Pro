import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { createExpressApp } from "./src/server/app";
import { ENV, validateEnvironment } from "./src/server/config/env";
import { runDatabaseSeed } from "./src/server/db/seed";
import { initPostgresSchema } from "./src/server/db/postgres";

const PORT = ENV.PORT || 3000;

async function startServer() {
  // Validate Environment
  const envCheck = validateEnvironment();
  if (envCheck.warnings.length > 0) {
    envCheck.warnings.forEach(w => console.warn(`[CONFIG WARNING] ${w}`));
  }
  if (!envCheck.valid) {
    envCheck.errors.forEach(e => console.error(`[CONFIG ERROR] ${e}`));
    if (ENV.NODE_ENV === "production") {
      process.exit(1);
    }
  }

  // Initialize PostgreSQL schema if configured
  if (ENV.DATABASE_URL) {
    try {
      await initPostgresSchema();
    } catch (pgErr) {
      console.warn("[INIT] PostgreSQL initialization note:", pgErr);
    }
  }

  // Initialize default database seeding if empty
  try {
    await runDatabaseSeed({ force: false });
  } catch (seedErr) {
    console.warn("[INIT] Database auto-seed check:", seedErr);
  }

  const app = createExpressApp();

  const port = parseInt(process.env.PORT || String(ENV.PORT || 3000), 10);

  if (ENV.NODE_ENV !== "production") {
    console.log("🚀 Starting server in DEVELOPMENT mode with Vite Middleware on port", port);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    let finalDistPath = path.join(process.cwd(), "dist");
    if (__dirname.endsWith("dist") || fs.existsSync(path.join(__dirname, "index.html"))) {
      finalDistPath = __dirname;
    }

    console.log(`🚀 Starting server in PRODUCTION mode serving static assets from: ${finalDistPath} on port ${port}`);
    app.use(express.static(finalDistPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(finalDistPath, "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`✅ Recruiter AI Pro Server is actively running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Fatal server startup error:", err);
  process.exit(1);
});
