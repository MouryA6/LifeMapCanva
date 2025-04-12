import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Define the shape types
export enum NodeType {
  RECTANGLE = "rectangle",
  CIRCLE = "circle",
  CLOUD = "cloud"
}

// Define the connection color types
export enum ConnectionColor {
  GREEN = "#4CAF50",
  RED = "#F44336",
  BLUE = "#2196F3",
  YELLOW = "#FFC107",
  PURPLE = "#9C27B0"
}

// Define the diagram table for storing canvas diagrams
export const diagrams = pgTable("diagrams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: integer("user_id").references(() => users.id),
  content: jsonb("content").notNull(), // Contains nodes and connections
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDiagramSchema = createInsertSchema(diagrams).pick({
  name: true,
  userId: true,
  content: true,
});

export const updateDiagramSchema = createInsertSchema(diagrams).pick({
  name: true,
  content: true,
});

// Define the types for the content of the diagram
export const nodeSchema = z.object({
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
  hasDoubleOutline: z.boolean().optional(),
});

export const connectionSchema = z.object({
  id: z.string(),
  from: z.string(), // node id
  to: z.string(), // node id
  color: z.nativeEnum(ConnectionColor).default(ConnectionColor.GREEN),
  points: z.array(z.number()).optional(),
});

export const diagramContentSchema = z.object({
  nodes: z.array(nodeSchema),
  connections: z.array(connectionSchema),
  canvasScale: z.number().default(1),
  canvasPosition: z.object({
    x: z.number().default(0),
    y: z.number().default(0),
  }),
});

export type InsertDiagram = z.infer<typeof insertDiagramSchema>;
export type UpdateDiagram = z.infer<typeof updateDiagramSchema>;
export type Diagram = typeof diagrams.$inferSelect;
export type Node = z.infer<typeof nodeSchema>;
export type Connection = z.infer<typeof connectionSchema>;
export type DiagramContent = z.infer<typeof diagramContentSchema>;
