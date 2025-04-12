import { Node, Connection, NodeType } from "@shared/schema";
import { Position } from "./types";
import { v4 as uuidv4 } from "uuid";

// Calculate connection points between nodes
export function calculateConnectionPoints(
  fromNode: Node,
  toNode: Node
): { start: Position; end: Position } {
  // Calculate center points
  const fromCenter = {
    x: fromNode.x + fromNode.width / 2,
    y: fromNode.y + fromNode.height / 2,
  };

  const toCenter = {
    x: toNode.x + toNode.width / 2,
    y: toNode.y + toNode.height / 2,
  };

  // Calculate the vector between centers
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const angle = Math.atan2(dy, dx);

  // Calculate intersection points with node boundaries
  let fromPoint: Position;
  let toPoint: Position;

  // For the starting node (fromNode)
  if (fromNode.type === NodeType.CIRCLE) {
    // For circle, intersection is along the radius
    const radius = Math.min(fromNode.width, fromNode.height) / 2;
    fromPoint = {
      x: fromCenter.x + Math.cos(angle) * radius,
      y: fromCenter.y + Math.sin(angle) * radius,
    };
  } else if (fromNode.type === NodeType.CLOUD) {
    // For cloud, approximate as circle but slightly smaller
    const radius = Math.min(fromNode.width, fromNode.height) * 0.4;
    fromPoint = {
      x: fromCenter.x + Math.cos(angle) * radius,
      y: fromCenter.y + Math.sin(angle) * radius,
    };
  } else {
    // For rectangle, find intersection with the appropriate edge
    const halfWidth = fromNode.width / 2;
    const halfHeight = fromNode.height / 2;
    
    // Determine which edge to use based on angle
    const tanAngle = Math.abs(Math.tan(angle));
    const edgeRatio = halfHeight / halfWidth;
    
    if (tanAngle > edgeRatio) {
      // Intersect with top or bottom edge
      const sgn = Math.sign(Math.sin(angle));
      fromPoint = {
        x: fromCenter.x + halfHeight * Math.cos(angle) / Math.sin(angle) * sgn,
        y: fromCenter.y + halfHeight * sgn,
      };
    } else {
      // Intersect with left or right edge
      const sgn = Math.sign(Math.cos(angle));
      fromPoint = {
        x: fromCenter.x + halfWidth * sgn,
        y: fromCenter.y + halfWidth * Math.sin(angle) / Math.cos(angle) * sgn,
      };
    }
    
    // Clamp to node boundaries
    fromPoint.x = Math.min(Math.max(fromPoint.x, fromNode.x), fromNode.x + fromNode.width);
    fromPoint.y = Math.min(Math.max(fromPoint.y, fromNode.y), fromNode.y + fromNode.height);
  }

  // For the ending node (toNode)
  if (toNode.type === NodeType.CIRCLE) {
    // For circle, intersection is along the radius
    const radius = Math.min(toNode.width, toNode.height) / 2;
    toPoint = {
      x: toCenter.x - Math.cos(angle) * radius,
      y: toCenter.y - Math.sin(angle) * radius,
    };
  } else if (toNode.type === NodeType.CLOUD) {
    // For cloud, approximate as circle but slightly smaller
    const radius = Math.min(toNode.width, toNode.height) * 0.4;
    toPoint = {
      x: toCenter.x - Math.cos(angle) * radius,
      y: toCenter.y - Math.sin(angle) * radius,
    };
  } else {
    // For rectangle, find intersection with the appropriate edge
    const halfWidth = toNode.width / 2;
    const halfHeight = toNode.height / 2;
    
    // Determine which edge to use based on angle
    const tanAngle = Math.abs(Math.tan(angle));
    const edgeRatio = halfHeight / halfWidth;
    
    if (tanAngle > edgeRatio) {
      // Intersect with top or bottom edge
      const sgn = Math.sign(Math.sin(angle));
      toPoint = {
        x: toCenter.x - halfHeight * Math.cos(angle) / Math.sin(angle) * sgn,
        y: toCenter.y - halfHeight * sgn,
      };
    } else {
      // Intersect with left or right edge
      const sgn = Math.sign(Math.cos(angle));
      toPoint = {
        x: toCenter.x - halfWidth * sgn,
        y: toCenter.y - halfWidth * Math.sin(angle) / Math.cos(angle) * sgn,
      };
    }
    
    // Clamp to node boundaries
    toPoint.x = Math.min(Math.max(toPoint.x, toNode.x), toNode.x + toNode.width);
    toPoint.y = Math.min(Math.max(toPoint.y, toNode.y), toNode.y + toNode.height);
  }

  return { start: fromPoint, end: toPoint };
}

// Generate bezier curve control points
export function generateBezierPoints(start: Position, end: Position): number[] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Control point distance scales with the distance between points
  const controlPointDistance = Math.min(100, distance * 0.4);
  
  // Control points are placed along the direction vector
  const control1 = {
    x: start.x + (dx / 3),
    y: start.y + (dy / 3),
  };
  
  const control2 = {
    x: start.x + (dx * 2 / 3),
    y: start.y + (dy * 2 / 3),
  };
  
  return [
    start.x, start.y,
    control1.x, control1.y,
    control2.x, control2.y,
    end.x, end.y,
  ];
}

// Calculate arrow head points
export function calculateArrowHead(end: Position, angle: number): number[] {
  const arrowSize = 10;
  const arrowAngle = 0.5; // in radians
  
  const point1 = {
    x: end.x - arrowSize * Math.cos(angle - arrowAngle),
    y: end.y - arrowSize * Math.sin(angle - arrowAngle),
  };
  
  const point2 = {
    x: end.x - arrowSize * Math.cos(angle + arrowAngle),
    y: end.y - arrowSize * Math.sin(angle + arrowAngle),
  };
  
  return [end.x, end.y, point1.x, point1.y, point2.x, point2.y];
}

// Create a new node
export function createNewNode(type: NodeType, position: Position, text: string = ""): Node {
  const defaults = {
    width: 120,
    height: 80,
    borderColor: "#4CAF50",
    borderWidth: 2,
    backgroundColor: "transparent",
  };
  
  if (type === NodeType.CIRCLE) {
    defaults.width = 80;
    defaults.height = 80;
  }
  
  return {
    id: uuidv4(),
    type,
    x: position.x - defaults.width / 2,
    y: position.y - defaults.height / 2,
    width: defaults.width,
    height: defaults.height,
    text,
    borderColor: defaults.borderColor,
    borderWidth: defaults.borderWidth,
    backgroundColor: defaults.backgroundColor,
    isSelected: false,
    isDragging: false,
  };
}

// Create a new connection
export function createNewConnection(fromNodeId: string, toNodeId: string, color: string): Connection {
  return {
    id: uuidv4(),
    from: fromNodeId,
    to: toNodeId,
    color,
  };
}

// Check if position is inside a node
export function isPositionInsideNode(position: Position, node: Node): boolean {
  if (node.type === NodeType.CIRCLE) {
    // For circle, check if distance to center is less than radius
    const center = {
      x: node.x + node.width / 2,
      y: node.y + node.height / 2,
    };
    const radius = Math.min(node.width, node.height) / 2;
    const dx = position.x - center.x;
    const dy = position.y - center.y;
    return dx * dx + dy * dy <= radius * radius;
  } else {
    // For rectangle and cloud, use simple boundary check
    return (
      position.x >= node.x &&
      position.x <= node.x + node.width &&
      position.y >= node.y &&
      position.y <= node.y + node.height
    );
  }
}

// Check for node collisions
export function checkNodeCollision(node: Node, nodes: Node[]): boolean {
  for (const other of nodes) {
    if (node.id === other.id) continue;
    
    // Simple rectangular collision detection
    if (
      node.x < other.x + other.width &&
      node.x + node.width > other.x &&
      node.y < other.y + other.height &&
      node.y + node.height > other.y
    ) {
      return true;
    }
  }
  
  return false;
}

// Export canvas as image
export function exportCanvasAsImage(stageRef: any): void {
  if (!stageRef.current) return;
  
  const uri = stageRef.current.toDataURL();
  const link = document.createElement('a');
  link.download = `life-canvas-flow-${new Date().toISOString().slice(0, 10)}.png`;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
