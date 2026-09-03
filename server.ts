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
  const isProd = (process.env.NODE_ENV === "production") || (ENV.NODE_ENV === "production");

  // 1. Validate Environment Configuration
  const envCheck = validateEnvironment();
  if (envCheck.warnings.length > 0) {
    envCheck.warnings.forEach(w => console.warn(`[CONFIG WARNING] ${w}`));
  }
  if (!envCheck.valid) {
    envCheck.errors.forEach(e => console.error(`[CONFIG FATAL ERROR] ${e}`));
    if (isProd) {
      console.error("❌ [STARTUP HALTED] Server cannot start in production due to missing or invalid mandatory configuration.");
      process.exit(1);
    }
  }

  // 2. Initialize PostgreSQL schema and pgvector
  if (isProd) {
    console.log("🐘 [STARTUP] Verifying PostgreSQL connection, relational schema, and pgvector extension...");
    const schemaReady = await initPostgresSchema();
    if (!schemaReady) {
      console.error("❌ [STARTUP FATAL] Failed to connect to PostgreSQL or initialize pgvector schema in production. Halting startup.");
      process.exit(1);
    }
    console.log("✅ [STARTUP] PostgreSQL database connection and pgvector schema verified.");
  } else if (ENV.DATABASE_URL) {
    try {
      await initPostgresSchema();
    } catch (pgErr) {
      console.warn("[INIT] PostgreSQL initialization note:", pgErr);
    }
  }

  // 3. Initialize default database seeding if empty
  try {
    await runDatabaseSeed({ force: false });
  } catch (seedErr) {
    console.warn("[INIT] Database auto-seed check:", seedErr);
  }

  const app = createExpressApp();

  const port = parseInt(process.env.PORT || String(ENV.PORT || 3000), 10);

  if (ENV.NODE_ENV !== "production") {
    console.log("🚀 Starting server in DEVELOPMENT mode with Vite Middleware on port", port);
    // Explicit static mount for /assets in dev mode before Vite middleware
    const publicAssetsDir = path.join(process.cwd(), "public", "assets");
    if (fs.existsSync(publicAssetsDir)) {
      app.use("/assets", express.static(publicAssetsDir));
    }
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Robust resolution of production dist directory
    let distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(path.join(__dirname, "index.html")) && __dirname.endsWith("dist")) {
      distPath = __dirname;
    } else if (fs.existsSync(path.join(__dirname, "dist", "index.html"))) {
      distPath = path.join(__dirname, "dist");
    }

    const publicPath = path.join(process.cwd(), "public");

    console.log(`🚀 Starting server in PRODUCTION mode serving static assets from: ${distPath} on port ${port}`);
    
    // 1. Primary static distribution assets
    app.use(express.static(distPath));
    if (fs.existsSync(path.join(distPath, "assets"))) {
      app.use("/assets", express.static(path.join(distPath, "assets")));
    }

    // 2. Secondary public directory fallback
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
      if (fs.existsSync(path.join(publicPath, "assets"))) {
        app.use("/assets", express.static(path.join(publicPath, "assets")));
      }
    }

    // 3. SPA catch-all navigation handler (prevents returning index.html for missing static files)
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/") || req.path.startsWith("/assets/") || path.extname(req.path)) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Resource not found: ${req.path}`
          }
        });
      }
      const indexPath = fs.existsSync(path.join(distPath, "index.html"))
        ? path.join(distPath, "index.html")
        : path.join(process.cwd(), "index.html");
      res.sendFile(indexPath);
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
