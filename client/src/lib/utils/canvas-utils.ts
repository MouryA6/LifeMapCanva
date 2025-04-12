import { NodeData, ConnectionData, CanvasData } from '@shared/schema';

/**
 * Calculate connection points between two nodes
 */
export function calculateConnectionPoints(
  source: NodeData,
  target: NodeData
): number[] {
  // Calculate center points
  const sourceCenter = {
    x: source.x + source.width / 2,
    y: source.y + source.height / 2
  };
  const targetCenter = {
    x: target.x + target.width / 2,
    y: target.y + target.height / 2
  };
  
  // Calculate angle between centers
  const angle = Math.atan2(
    targetCenter.y - sourceCenter.y,
    targetCenter.x - sourceCenter.x
  );
  
  // Calculate source edge point based on node type
  let sourceX, sourceY;
  
  if (source.type === 'circle') {
    // For circles, use radius
    const radius = source.width / 2;
    sourceX = sourceCenter.x + Math.cos(angle) * radius;
    sourceY = sourceCenter.y + Math.sin(angle) * radius;
  } else if (source.type === 'cloud') {
    // For clouds, approximate with an ellipse
    const a = source.width / 2;
    const b = source.height / 2;
    const t = Math.atan2(a * Math.sin(angle), b * Math.cos(angle));
    sourceX = sourceCenter.x + a * Math.cos(t) * Math.sign(Math.cos(angle));
    sourceY = sourceCenter.y + b * Math.sin(t) * Math.sign(Math.sin(angle));
  } else {
    // For rectangles, find intersection with edge
    const halfWidth = source.width / 2;
    const halfHeight = source.height / 2;
    
    if (Math.abs(Math.cos(angle)) * halfHeight > Math.abs(Math.sin(angle)) * halfWidth) {
      // Intersect with right/left edge
      sourceX = sourceCenter.x + Math.sign(Math.cos(angle)) * halfWidth;
      sourceY = sourceCenter.y + (Math.tan(angle) * Math.sign(Math.cos(angle)) * halfWidth);
    } else {
      // Intersect with top/bottom edge
      sourceX = sourceCenter.x + ((1 / Math.tan(angle)) * Math.sign(Math.sin(angle)) * halfHeight);
      sourceY = sourceCenter.y + Math.sign(Math.sin(angle)) * halfHeight;
    }
  }
  
  // Calculate target edge point using the same approach
  let targetX, targetY;
  
  if (target.type === 'circle') {
    const radius = target.width / 2;
    targetX = targetCenter.x - Math.cos(angle) * radius;
    targetY = targetCenter.y - Math.sin(angle) * radius;
  } else if (target.type === 'cloud') {
    const a = target.width / 2;
    const b = target.height / 2;
    const t = Math.atan2(a * Math.sin(angle), b * Math.cos(angle));
    targetX = targetCenter.x - a * Math.cos(t) * Math.sign(Math.cos(angle));
    targetY = targetCenter.y - b * Math.sin(t) * Math.sign(Math.sin(angle));
  } else {
    const halfWidth = target.width / 2;
    const halfHeight = target.height / 2;
    
    if (Math.abs(Math.cos(angle)) * halfHeight > Math.abs(Math.sin(angle)) * halfWidth) {
      targetX = targetCenter.x - Math.sign(Math.cos(angle)) * halfWidth;
      targetY = targetCenter.y - (Math.tan(angle) * Math.sign(Math.cos(angle)) * halfWidth);
    } else {
      targetX = targetCenter.x - ((1 / Math.tan(angle)) * Math.sign(Math.sin(angle)) * halfHeight);
      targetY = targetCenter.y - Math.sign(Math.sin(angle)) * halfHeight;
    }
  }
  
  // Create a curved path between the two points
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2 + 20; // Add curvature
  
  return [sourceX, sourceY, midX, midY, targetX, targetY];
}

/**
 * Export canvas to SVG
 */
export function exportCanvasToSVG(canvas: CanvasData): string {
  // Create SVG element
  let svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#4CAF50" />
        </marker>
      </defs>
      <rect width="100%" height="100%" fill="#121212" />
  `;
  
  // Add connections
  for (const connection of canvas.connections) {
    const source = canvas.nodes.find(n => n.id === connection.sourceId);
    const target = canvas.nodes.find(n => n.id === connection.targetId);
    
    if (!source || !target) continue;
    
    const points = calculateConnectionPoints(source, target);
    
    svgContent += `
      <path 
        d="M ${points[0]},${points[1]} Q ${points[2]},${points[3]} ${points[4]},${points[5]}" 
        fill="none" 
        stroke="${connection.color}" 
        stroke-width="2" 
        marker-end="url(#arrowhead)" 
      />
    `;
  }
  
  // Add nodes
  for (const node of canvas.nodes) {
    switch (node.type) {
      case 'circle':
        const cx = node.x + node.width / 2;
        const cy = node.y + node.height / 2;
        const r = node.width / 2;
        
        svgContent += `
          <circle 
            cx="${cx}" 
            cy="${cy}" 
            r="${r}" 
            fill="#1A1A1A" 
            stroke="${node.color}" 
            stroke-width="2" 
          />
          <text 
            x="${cx}" 
            y="${cy}" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            font-family="Poppins, sans-serif" 
            font-size="16" 
            font-weight="600" 
            fill="#FAFAFA"
          >${node.title}</text>
        `;
        break;
        
      case 'rectangle':
        svgContent += `
          <rect 
            x="${node.x}" 
            y="${node.y}" 
            width="${node.width}" 
            height="${node.height}" 
            rx="4" 
            fill="#1A1A1A" 
            stroke="${node.color}" 
            stroke-width="2" 
          />
          <text 
            x="${node.x + node.width / 2}" 
            y="${node.y + node.height / 2}" 
            text-anchor="middle" 
            dominant-baseline="middle" 
            font-family="Poppins, sans-serif" 
            font-size="14" 
            font-weight="500" 
            fill="#FAFAFA"
          >${node.title}</text>
        `;
        if (node.description) {
          svgContent += `
            <text 
              x="${node.x + node.width / 2}" 
              y="${node.y + node.height / 2 + 15}" 
              text-anchor="middle" 
              font-family="Poppins, sans-serif" 
              font-size="12" 
              fill="#FAFAFA"
            >${node.description}</text>
          `;
        }
        break;
        
      case 'cloud':
        const cloudPath = generateCloudPath(node.x + node.width / 2, node.y + node.height / 2, node.width, node.height);
        
        svgContent += `
          <path 
            d="${cloudPath}" 
            fill="#1A1A1A" 
            stroke="${node.color}" 
            stroke-width="2" 
          />
          <text 
            x="${node.x + node.width / 2}" 
            y="${node.y + node.height / 2 - 5}" 
            text-anchor="middle" 
            font-family="Poppins, sans-serif" 
            font-size="12" 
            font-weight="500" 
            fill="#FAFAFA"
          >${node.title}</text>
        `;
        if (node.description) {
          svgContent += `
            <text 
              x="${node.x + node.width / 2}" 
              y="${node.y + node.height / 2 + 15}" 
              text-anchor="middle" 
              font-family="Poppins, sans-serif" 
              font-size="14" 
              font-weight="600" 
              fill="#FAFAFA"
            >${node.description}</text>
          `;
        }
        break;
    }
  }
  
  // Close SVG
  svgContent += `</svg>`;
  
  return svgContent;
}

// Helper function to generate cloud path
function generateCloudPath(x: number, y: number, width: number, height: number): string {
  const w = width / 2;
  const h = height / 2;
  
  return `
    M ${x - w},${y} 
    C ${x - w},${y - 15} ${x - w * 0.7},${y - h} ${x - w * 0.4},${y - h} 
    C ${x - w * 0.3},${y - h * 1.5} ${x},${y - h * 1.5} ${x + w * 0.1},${y - h} 
    C ${x + w * 0.4},${y - h * 1.3} ${x + w * 0.7},${y - h} ${x + w * 0.7},${y - h / 2} 
    C ${x + w},${y - h / 2} ${x + w},${y} ${x + w * 0.7},${y + h / 3} 
    C ${x + w * 0.9},${y + h * 0.7} ${x + w * 0.7},${y + h} ${x + w * 0.4},${y + h} 
    C ${x + w * 0.3},${y + h * 1.5} ${x},${y + h * 1.5} ${x - w * 0.1},${y + h} 
    C ${x - w * 0.4},${y + h * 1.2} ${x - w * 0.9},${y + h * 0.7} ${x - w * 0.8},${y + h / 6} 
    C ${x - w},${y + h / 6} ${x - w * 1.1},${y - h / 6} ${x - w},${y} 
    Z
  `;
}

/**
 * Download data as a file
 */
export function downloadFile(filename: string, content: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  
  URL.revokeObjectURL(url);
}
