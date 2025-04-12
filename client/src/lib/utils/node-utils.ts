import { NodeData, NodeType } from '@shared/schema';

/**
 * Default dimensions for different node types
 */
export const DEFAULT_NODE_DIMENSIONS = {
  [NodeType.RECTANGLE]: { width: 120, height: 60 },
  [NodeType.CIRCLE]: { width: 60, height: 60 },
  [NodeType.CLOUD]: { width: 160, height: 80 },
};

/**
 * Format title and description to fit in node
 * @param node The node to format text for
 * @param maxLineLength Maximum characters per line
 * @returns Formatted title and description
 */
export function formatNodeText(
  node: NodeData,
  maxLineLength: number = 20
): { formattedTitle: string; formattedDescription: string } {
  let formattedTitle = node.title;
  let formattedDescription = node.description || '';
  
  // If title is too long, truncate it
  if (formattedTitle.length > maxLineLength) {
    formattedTitle = formattedTitle.substring(0, maxLineLength - 3) + '...';
  }
  
  // For description, we can have multiple lines
  if (formattedDescription) {
    const words = formattedDescription.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxLineLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    // Limit to 3 lines maximum for display
    const maxLines = 3;
    if (lines.length > maxLines) {
      lines.splice(maxLines);
      lines[maxLines - 1] += '...';
    }
    
    formattedDescription = lines.join('\n');
  }
  
  return { formattedTitle, formattedDescription };
}

/**
 * Check if two nodes overlap
 * @param node1 First node
 * @param node2 Second node
 * @param padding Optional padding around nodes
 * @returns Boolean indicating if nodes overlap
 */
export function checkNodeOverlap(
  node1: NodeData,
  node2: NodeData,
  padding: number = 10
): boolean {
  // Handle different node types
  let n1Left, n1Right, n1Top, n1Bottom;
  let n2Left, n2Right, n2Top, n2Bottom;
  
  // For rectangular nodes or cloud nodes, use the bounding box
  n1Left = node1.x - padding;
  n1Right = node1.x + node1.width + padding;
  n1Top = node1.y - padding;
  n1Bottom = node1.y + node1.height + padding;
  
  n2Left = node2.x - padding;
  n2Right = node2.x + node2.width + padding;
  n2Top = node2.y - padding;
  n2Bottom = node2.y + node2.height + padding;
  
  // Special case for circles
  if (node1.type === NodeType.CIRCLE && node2.type === NodeType.CIRCLE) {
    const radius1 = node1.width / 2 + padding;
    const radius2 = node2.width / 2 + padding;
    
    const center1 = {
      x: node1.x + node1.width / 2,
      y: node1.y + node1.height / 2
    };
    
    const center2 = {
      x: node2.x + node2.width / 2,
      y: node2.y + node2.height / 2
    };
    
    const distance = Math.sqrt(
      Math.pow(center2.x - center1.x, 2) + Math.pow(center2.y - center1.y, 2)
    );
    
    return distance < radius1 + radius2;
  }
  
  // For other combinations, use bounding box check
  return !(
    n1Right < n2Left ||
    n1Left > n2Right ||
    n1Bottom < n2Top ||
    n1Top > n2Bottom
  );
}

/**
 * Find an available position for a new node that doesn't overlap with existing nodes
 * @param nodes Existing nodes on the canvas
 * @param nodeType Type of node to position
 * @param startX Starting X position
 * @param startY Starting Y position
 * @returns Position for new node
 */
export function findAvailablePosition(
  nodes: NodeData[],
  nodeType: NodeType,
  startX: number,
  startY: number
): { x: number; y: number } {
  const { width, height } = DEFAULT_NODE_DIMENSIONS[nodeType];
  const padding = 20;
  
  // Start with initial position
  let position = { x: startX, y: startY };
  
  // Create a dummy node for overlap checking
  const newNode: NodeData = {
    id: -1,
    type: nodeType,
    title: '',
    x: position.x,
    y: position.y,
    width,
    height,
    color: '',
    data: {}
  };
  
  let overlapping = false;
  
  // Check if the position overlaps with any existing node
  for (const node of nodes) {
    if (checkNodeOverlap(newNode, node, padding)) {
      overlapping = true;
      break;
    }
  }
  
  // If overlapping, find a new position using a spiral pattern
  if (overlapping) {
    const spiralStep = 30;
    let spiralRadius = spiralStep;
    let angle = 0;
    
    // Try positions in a spiral pattern
    while (overlapping && spiralRadius < 500) {
      angle += Math.PI / 8;
      spiralRadius += spiralStep / (2 * Math.PI);
      
      position.x = startX + spiralRadius * Math.cos(angle);
      position.y = startY + spiralRadius * Math.sin(angle);
      
      newNode.x = position.x;
      newNode.y = position.y;
      
      // Check for overlaps at new position
      overlapping = false;
      for (const node of nodes) {
        if (checkNodeOverlap(newNode, node, padding)) {
          overlapping = true;
          break;
        }
      }
    }
  }
  
  return position;
}

/**
 * Generate a random position within canvas bounds
 * @param canvasWidth Width of the canvas
 * @param canvasHeight Height of the canvas
 * @param nodeWidth Width of the node
 * @param nodeHeight Height of the node
 * @returns Random position
 */
export function generateRandomPosition(
  canvasWidth: number,
  canvasHeight: number,
  nodeWidth: number,
  nodeHeight: number
): { x: number; y: number } {
  const margin = 50;
  
  return {
    x: margin + Math.random() * (canvasWidth - nodeWidth - margin * 2),
    y: margin + Math.random() * (canvasHeight - nodeHeight - margin * 2)
  };
}

/**
 * Create a new node with default properties
 * @param nodeType Type of node to create
 * @param x X position
 * @param y Y position
 * @param title Optional title
 * @param description Optional description
 * @returns New node object
 */
export function createDefaultNode(
  nodeType: NodeType,
  x: number,
  y: number,
  title: string = 'New Node',
  description: string = ''
): Omit<NodeData, 'id'> {
  const { width, height } = DEFAULT_NODE_DIMENSIONS[nodeType];
  
  return {
    type: nodeType,
    title,
    description,
    x,
    y,
    width,
    height,
    color: '#4CAF50',
    data: {}
  };
}
