import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertDiagramSchema,
  updateDiagramSchema,
  diagramContentSchema,
  nodeSchema,
  connectionSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API endpoints
  app.get("/api/diagrams", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const diagrams = await storage.getDiagramsByUserId(userId);
      res.json(diagrams);
    } catch (error) {
      console.error("Error fetching diagrams:", error);
      res.status(500).json({ message: "Failed to fetch diagrams" });
    }
  });

  app.get("/api/diagrams/:id", async (req: Request, res: Response) => {
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

  app.post("/api/diagrams", async (req: Request, res: Response) => {
    try {
      const diagramData = insertDiagramSchema.parse(req.body);
      
      // Validate content structure
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

  app.put("/api/diagrams/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const updateData = updateDiagramSchema.parse(req.body);
      
      // Validate content structure
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

  app.delete("/api/diagrams/:id", async (req: Request, res: Response) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
