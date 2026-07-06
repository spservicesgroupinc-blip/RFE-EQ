import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json());
  
  // API route to proxy to App Script
  app.post("/api/proxy", async (req, res) => {
    const backendUrl = process.env.APP_SCRIPT_URL;
    if (!backendUrl) {
      return res.status(500).json({ status: "error", message: "APP_SCRIPT_URL is not defined in the server environment" });
    }

    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        body: JSON.stringify(req.body),
      });

      // Google App Script typically returns JSON, but since it was used with "no-cors"
      // it might not return standard JSON we can parse easily, or we can just send success
      // Actually, if we proxy from the server, we don't need no-cors and we can read the response.
      const data = await response.json().catch(() => ({ status: 'success', message: 'Request sent (parsing error)' }));
      res.json(data);
    } catch (e) {
      console.error("Proxy error:", e);
      res.status(500).json({ status: "error", message: "Failed to fetch from Google Apps Script" });
    }
  });

  app.get("/api/assets", async (req, res) => {
    const backendUrl = process.env.APP_SCRIPT_URL;
    if (!backendUrl) {
      return res.status(500).json({ status: "error", message: "APP_SCRIPT_URL is not defined in the server environment" });
    }

    try {
      const response = await fetch(backendUrl);
      const data = await response.json();
      res.json(data);
    } catch (e) {
      console.error("Proxy error:", e);
      res.status(500).json({ status: "error", message: "Failed to fetch assets" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
