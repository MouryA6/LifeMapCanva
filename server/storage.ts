import { users, diagrams, type User, type InsertUser, type Diagram, type InsertDiagram, type UpdateDiagram } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Diagram operations
  createDiagram(diagram: InsertDiagram): Promise<Diagram>;
  getDiagram(id: number): Promise<Diagram | undefined>;
  getDiagramsByUserId(userId: number): Promise<Diagram[]>;
  updateDiagram(id: number, updates: UpdateDiagram): Promise<Diagram | undefined>;
  deleteDiagram(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createDiagram(insertDiagram: InsertDiagram): Promise<Diagram> {
    const now = new Date();
    const [diagram] = await db
      .insert(diagrams)
      .values({
        ...insertDiagram,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return diagram;
  }

  async getDiagram(id: number): Promise<Diagram | undefined> {
    const [diagram] = await db
      .select()
      .from(diagrams)
      .where(eq(diagrams.id, id));
    return diagram;
  }

  async getDiagramsByUserId(userId: number): Promise<Diagram[]> {
    return await db
      .select()
      .from(diagrams)
      .where(eq(diagrams.userId, userId))
      .orderBy(desc(diagrams.updatedAt));
  }

  async updateDiagram(id: number, updates: UpdateDiagram): Promise<Diagram | undefined> {
    const [updatedDiagram] = await db
      .update(diagrams)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(diagrams.id, id))
      .returning();
    return updatedDiagram;
  }

  async deleteDiagram(id: number): Promise<boolean> {
    const result = await db
      .delete(diagrams)
      .where(eq(diagrams.id, id))
      .returning({ deleted: sql`1` });
    
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
