import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { createExpressApp } from "./src/server/app";
import { ENV } from "./src/server/config/env";
import { runDatabaseSeed } from "./src/server/db/seed";

const PORT = ENV.PORT || 3000;

async function startServer() {
  // Initialize default database seeding if empty
  try {
    await runDatabaseSeed({ force: false });
  } catch (seedErr) {
    console.warn("[INIT] Database auto-seed check:", seedErr);
  }

  const app = createExpressApp();

  if (ENV.NODE_ENV !== "production") {
    console.log("🚀 Starting server in DEVELOPMENT mode with Vite Middleware on port", PORT);
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

    console.log(`🚀 Starting server in PRODUCTION mode serving static assets from: ${finalDistPath}`);
    app.use(express.static(finalDistPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(finalDistPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Recruiter AI Pro Server is actively running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Fatal server startup error:", err);
  process.exit(1);
});
