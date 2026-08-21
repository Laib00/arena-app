import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "node:http";

/** Local /api/gemini so `npm run dev` works without Vercel login. */
function localGeminiApi(): Plugin {
  return {
    name: "local-gemini-api",
    configureServer(server: ViteDevServer) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value;
      }

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const path = req.url?.split("?")[0];
        if (path !== "/api/gemini") return next();

        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(Buffer.from(chunk));
          const raw = Buffer.concat(chunks).toString("utf8");
          let body: Record<string, unknown> = {};
          try {
            body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
          } catch {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Invalid JSON body" }));
            return;
          }

          const { default: handler } = await import("./api/gemini.js") as {
            default: (
              req: { method: string; body: Record<string, unknown> },
              res: {
                statusCode: number;
                status: (code: number) => unknown;
                json: (data: unknown) => void;
              }
            ) => Promise<void>;
          };
          const fakeReq = { method: "POST", body };
          const fakeRes = {
            statusCode: 200,
            status(code: number) {
              this.statusCode = code;
              return this;
            },
            json(data: unknown) {
              res.statusCode = this.statusCode;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
            },
          };
          await handler(fakeReq, fakeRes);
        } catch (e) {
          const message = e instanceof Error ? e.message : "Local API error";
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localGeminiApi()],
});
