import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerWebhookRoutes } from "./webhookRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

/**
 * Simple in-memory rate limiter (no external deps).
 * Sliding window per IP: allows `max` requests per `windowMs`.
 */
function createRateLimiter(windowMs: number, max: number) {
  const hits = new Map<string, number[]>();

  // Clean up stale entries every minute
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    hits.forEach((timestamps: number[], key: string) => {
      const valid = timestamps.filter((t: number) => t > cutoff);
      if (valid.length === 0) hits.delete(key);
      else hits.set(key, valid);
    });
  }, 60_000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const cutoff = now - windowMs;
    const timestamps = (hits.get(ip) || []).filter((t: number) => t > cutoff);

    if (timestamps.length >= max) {
      res.status(429).json({ error: "Too many requests, please try again later" });
      return;
    }

    timestamps.push(now);
    hits.set(ip, timestamps);
    next();
  };
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();

  // Trust the reverse proxy (Manus / cloud platform) so Express correctly reads
  // req.protocol, req.ip, req.hostname from X-Forwarded-* headers.
  app.set("trust proxy", 1);

  const server = createServer(app);
  // Register webhook routes BEFORE body parsers (they need raw body)
  registerWebhookRoutes(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Rate limiting for API routes: 100 requests per minute per IP
  const apiLimiter = createRateLimiter(60_000, 100);
  app.use("/api/trpc", apiLimiter);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
