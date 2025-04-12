import { NodeType } from "@shared/schema";
import Konva from "konva";

// Function to draw a cloud shape
export function drawCloud(
  context: Konva.Context,
  shape: Konva.Shape,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const radius = Math.min(width, height) * 0.15;
  
  // Begin drawing path
  context.beginPath();
  
  // Define cloud bumps positions
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Top bumps
  context.arc(x + width * 0.3, y + height * 0.3, radius, 0, Math.PI * 2, false);
  context.arc(x + width * 0.5, y + height * 0.2, radius, 0, Math.PI * 2, false);
  context.arc(x + width * 0.7, y + height * 0.3, radius, 0, Math.PI * 2, false);
  
  // Right bump
  context.arc(x + width * 0.8, y + height * 0.5, radius, 0, Math.PI * 2, false);
  
  // Bottom bumps
  context.arc(x + width * 0.7, y + height * 0.7, radius, 0, Math.PI * 2, false);
  context.arc(x + width * 0.5, y + height * 0.8, radius, 0, Math.PI * 2, false);
  context.arc(x + width * 0.3, y + height * 0.7, radius, 0, Math.PI * 2, false);
  
  // Left bump
  context.arc(x + width * 0.2, y + height * 0.5, radius, 0, Math.PI * 2, false);
  
  // Close the path
  context.closePath();
  
  // Apply styles
  context.fillStrokeShape(shape);
}

// Function to get the appropriate shape drawer for a node type
export function getShapeDrawer(nodeType: NodeType): (
  context: Konva.Context,
  shape: Konva.Shape,
  x: number,
  y: number,
  width: number,
  height: number
) => void {
  switch (nodeType) {
    case NodeType.CLOUD:
      return drawCloud;
    default:
      return (context, shape, x, y, width, height) => {
        // Default behavior is to do nothing and let Konva handle it
      };
  }
}

// Function to create a wrapper component for a custom shape
export function createCustomShape(
  nodeType: NodeType,
  props: any
): any {
  // For now, let's return a simple approximation instead
  // This simplification avoids JSX transpilation issues
  return null;
}
