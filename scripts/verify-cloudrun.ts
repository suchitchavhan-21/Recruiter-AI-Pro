import https from "https";

const CLOUD_RUN_URL = "https://ais-pre-7pjw7eopofiszarisybzy3-474637480139.asia-east1.run.app";

function fetchHttps(urlPath: string, headers: Record<string, string> = {}, postData?: string): Promise<{ status: number; headers: any; data: any; raw: string; location?: string }> {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(urlPath, CLOUD_RUN_URL);
    const reqHeaders: Record<string, any> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json, text/html, */*",
      ...headers
    };
    if (postData) {
      reqHeaders["Content-Type"] = "application/json";
      reqHeaders["Content-Length"] = Buffer.byteLength(postData);
    }

    const reqOptions: https.RequestOptions = {
      hostname: fullUrl.hostname,
      port: 443,
      path: fullUrl.pathname + fullUrl.search,
      method: postData ? "POST" : "GET",
      headers: reqHeaders,
      timeout: 15000
    };

    const req = https.request(reqOptions, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode || 200, headers: res.headers, data: parsed, raw: data, location: res.headers.location });
        } catch {
          resolve({ status: res.statusCode || 200, headers: res.headers, data: null, raw: data, location: res.headers.location });
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function run() {
  console.log("=================================================================");
  console.log("🚀 TESTING LIVE CLOUD RUN DEPLOYMENT AT:");
  console.log(CLOUD_RUN_URL);
  console.log("=================================================================\n");

  try {
    const res1 = await fetchHttps("/api/health");
    console.log("GET /api/health Initial Response:");
    console.log("Status:", res1.status);
    console.log("Headers:", res1.headers);
    console.log("Set-Cookie:", res1.headers["set-cookie"]);
    console.log("Location:", res1.location);

    if (res1.headers["set-cookie"]) {
      const cookies = res1.headers["set-cookie"].map((c: string) => c.split(";")[0]).join("; ");
      console.log("\nRetrying GET /api/health with Cookie:", cookies);
      const res2 = await fetchHttps("/api/health", { "Cookie": cookies });
      console.log("Status with Cookie:", res2.status);
      console.log("Location with Cookie:", res2.location);
      console.log("Body preview:\n", res2.raw.slice(0, 400));
      
      if (res1.location) {
        console.log("\nFollowing redirect to:", res1.location);
        const res3 = await fetchHttps(res1.location, { "Cookie": cookies });
        console.log("Status at redirect location:", res3.status);
        console.log("Body at redirect location:\n", res3.raw.slice(0, 400));
      }
    }
  } catch (err: any) {
    console.error("Connection failed:", err.message);
  }
}

run();
