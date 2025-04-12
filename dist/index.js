var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  ConnectionColor: () => ConnectionColor,
  NodeType: () => NodeType,
  connectionSchema: () => connectionSchema,
  diagramContentSchema: () => diagramContentSchema,
  diagrams: () => diagrams,
  insertDiagramSchema: () => insertDiagramSchema,
  insertUserSchema: () => insertUserSchema,
  nodeSchema: () => nodeSchema,
  updateDiagramSchema: () => updateDiagramSchema,
  users: () => users
});
import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull()
});
var insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true
});
var NodeType = /* @__PURE__ */ ((NodeType2) => {
  NodeType2["RECTANGLE"] = "rectangle";
  NodeType2["CIRCLE"] = "circle";
  NodeType2["CLOUD"] = "cloud";
  return NodeType2;
})(NodeType || {});
var ConnectionColor = /* @__PURE__ */ ((ConnectionColor2) => {
  ConnectionColor2["GREEN"] = "#4CAF50";
  ConnectionColor2["RED"] = "#F44336";
  ConnectionColor2["BLUE"] = "#2196F3";
  ConnectionColor2["YELLOW"] = "#FFC107";
  ConnectionColor2["PURPLE"] = "#9C27B0";
  return ConnectionColor2;
})(ConnectionColor || {});
var diagrams = pgTable("diagrams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id),
  content: jsonb("content").notNull(),
  // Contains nodes and connections
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var insertDiagramSchema = createInsertSchema(diagrams).pick({
  name: true,
  userId: true,
  content: true
});
var updateDiagramSchema = createInsertSchema(diagrams).pick({
  name: true,
  content: true
});
var nodeSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(NodeType),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  text: z.string(),
  borderColor: z.string().default("#4CAF50"),
  borderWidth: z.number().default(2),
  backgroundColor: z.string().default("transparent"),
  isDragging: z.boolean().optional(),
  isSelected: z.boolean().optional(),
  hasBorder: z.boolean().optional(),
  hasDoubleOutline: z.boolean().optional()
});
var connectionSchema = z.object({
  id: z.string(),
  from: z.string(),
  // node id
  to: z.string(),
  // node id
  color: z.nativeEnum(ConnectionColor).default("#4CAF50" /* GREEN */),
  points: z.array(z.number()).optional()
});
var diagramContentSchema = z.object({
  nodes: z.array(nodeSchema),
  connections: z.array(connectionSchema),
  canvasScale: z.number().default(1),
  canvasPosition: z.object({
    x: z.number().default(0),
    y: z.number().default(0)
  })
});

// server/db.ts
import dotenv from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
dotenv.config();
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, sql } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async createDiagram(insertDiagram) {
    const now = /* @__PURE__ */ new Date();
    const [diagram] = await db.insert(diagrams).values({
      ...insertDiagram,
      createdAt: now,
      updatedAt: now
    }).returning();
    return diagram;
  }
  async getDiagram(id) {
    const [diagram] = await db.select().from(diagrams).where(eq(diagrams.id, id));
    return diagram;
  }
  async getDiagramsByUserId(userId) {
    return await db.select().from(diagrams).where(eq(diagrams.userId, userId)).orderBy(desc(diagrams.updatedAt));
  }
  async updateDiagram(id, updates) {
    const [updatedDiagram] = await db.update(diagrams).set({
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(diagrams.id, id)).returning();
    return updatedDiagram;
  }
  async deleteDiagram(id) {
    const result = await db.delete(diagrams).where(eq(diagrams.id, id)).returning({ deleted: sql`1` });
    return result.length > 0;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
async function registerRoutes(app2) {
  app2.get("/api/diagrams", async (req, res) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : void 0;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const diagrams2 = await storage.getDiagramsByUserId(userId);
      res.json(diagrams2);
    } catch (error) {
      console.error("Error fetching diagrams:", error);
      res.status(500).json({ message: "Failed to fetch diagrams" });
    }
  });
  app2.get("/api/diagrams/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const diagram = await storage.getDiagram(id);
      if (!diagram) {
        return res.status(404).json({ message: "Diagram not found" });
      }
      res.json(diagram);
    } catch (error) {
      console.error("Error fetching diagram:", error);
      res.status(500).json({ message: "Failed to fetch diagram" });
    }
  });
  app2.post("/api/diagrams", async (req, res) => {
    try {
      const diagramData = insertDiagramSchema.parse(req.body);
      try {
        diagramContentSchema.parse(diagramData.content);
      } catch (err) {
        if (err instanceof ZodError) {
          const validationError = fromZodError(err);
          return res.status(400).json({ message: validationError.message });
        }
        throw err;
      }
      const newDiagram = await storage.createDiagram(diagramData);
      res.status(201).json(newDiagram);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating diagram:", error);
      res.status(500).json({ message: "Failed to create diagram" });
    }
  });
  app2.put("/api/diagrams/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updateData = updateDiagramSchema.parse(req.body);
      try {
        diagramContentSchema.parse(updateData.content);
      } catch (err) {
        if (err instanceof ZodError) {
          const validationError = fromZodError(err);
          return res.status(400).json({ message: validationError.message });
        }
        throw err;
      }
      const updatedDiagram = await storage.updateDiagram(id, updateData);
      if (!updatedDiagram) {
        return res.status(404).json({ message: "Diagram not found" });
      }
      res.json(updatedDiagram);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating diagram:", error);
      res.status(500).json({ message: "Failed to update diagram" });
    }
  });
  app2.delete("/api/diagrams/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const success = await storage.deleteDiagram(id);
      if (!success) {
        return res.status(404).json({ message: "Diagram not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting diagram:", error);
      res.status(500).json({ message: "Failed to delete diagram" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
app.use((req, res, next) => {
  if (req.method === "PATCH" || req.method === "PUT") {
    req.body = { ...req.body, autoApplied: true };
  }
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  const host = "127.0.0.1";
  server.listen(port, host, () => {
    log(`serving on http://${host}:${port}`);
  });
})();
