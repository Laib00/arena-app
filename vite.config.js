import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

/** Local /api/gemini so `npm run dev` works without Vercel login. */
function localGeminiApi() {
  return {
    name: "local-gemini-api",
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value;
      }

      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split("?")[0];
        if (path !== "/api/gemini") return next();

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        try {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          const raw = Buffer.concat(chunks).toString("utf8");
          let body = {};
          try {
            body = raw ? JSON.parse(raw) : {};
          } catch {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Invalid JSON body" }));
            return;
          }

          const { default: handler } = await import("./api/gemini.js");
          const fakeReq = { method: "POST", body };
          const fakeRes = {
            statusCode: 200,
            status(code) {
              this.statusCode = code;
              return this;
            },
            json(data) {
              res.statusCode = this.statusCode;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
            },
          };
          await handler(fakeReq, fakeRes);
        } catch (e) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: e.message || "Local API error" }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localGeminiApi()],
});
