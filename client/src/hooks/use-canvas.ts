import { useCallback, useState, useRef, MutableRefObject } from 'react';
import { useCanvas } from '@/components/ui/canvas-context';
import { NodeData, ConnectionData } from '@shared/schema';

interface UseCanvasReturn {
  stageRef: MutableRefObject<any>;
  handleStageMouseDown: (e: any) => void;
  handleStageMouseMove: (e: any) => void;
  handleStageMouseUp: () => void;
  handleStageClick: (e: any) => void;
  handleWheel: (e: any) => void;
  handleNodeDragStart: (e: any) => void;
  handleNodeDragMove: (e: any) => void;
  handleNodeDragEnd: (e: any) => void;
  handleNodeClick: (nodeId: number) => void;
  handleConnectionClick: (connectionId: number) => void;
  getConnectionPoints: (source: NodeData, target: NodeData) => number[];
  isDragging: boolean;
  pointerPosition: { x: number; y: number } | null;
}

export function useCanvasOperations(): UseCanvasReturn {
  const stageRef = useRef<any>(null);
  const {
    canvas,
    selectedNodeId,
    selectedConnectionId,
    tool,
    scale,
    position,
    connectingNode,
    
    setSelectedNodeId,
    setSelectedConnectionId,
    setPosition,
    setScale,
    
    updateNode,
    finishConnecting,
    cancelConnecting,
  } = useCanvas();
  
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [pointerPosition, setPointerPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Handle canvas dragging (when tool is 'move')
  const handleStageMouseDown = useCallback((e: any) => {
    // Only handle canvas dragging when tool is 'move'
    if (tool !== 'move') return;
    
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    
    setIsDragging(true);
    setDragStartPosition({
      x: pointerPos.x - position.x,
      y: pointerPos.y - position.y,
    });
    
    // Deselect any selected nodes or connections
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
  }, [tool, position, setSelectedNodeId, setSelectedConnectionId]);
  
  const handleStageMouseMove = useCallback((e: any) => {
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    
    setPointerPosition({
      x: (pointerPos.x - position.x) / scale,
      y: (pointerPos.y - position.y) / scale,
    });
    
    if (isDragging && tool === 'move' && dragStartPosition) {
      const newPosition = {
        x: pointerPos.x - dragStartPosition.x,
        y: pointerPos.y - dragStartPosition.y,
      };
      
      setPosition(newPosition);
    }
  }, [isDragging, tool, dragStartPosition, scale, position, setPosition]);
  
  const handleStageMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStartPosition(null);
    
    // If we're in connection mode and we didn't connect to a node, cancel connecting
    if (connectingNode && tool === 'connect') {
      cancelConnecting();
    }
  }, [connectingNode, tool, cancelConnecting]);
  
  const handleStageClick = useCallback((e: any) => {
    // Get the clicked element
    const clickedElement = e.target;
    
    // If we clicked on the background, deselect everything
    if (clickedElement === e.target.getStage()) {
      setSelectedNodeId(null);
      setSelectedConnectionId(null);
    }
  }, [setSelectedNodeId, setSelectedConnectionId]);
  
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    
    const stage = stageRef.current;
    const oldScale = scale;
    
    // Handle zooming
    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
    
    // Limit zoom levels
    const limitedScale = Math.max(0.1, Math.min(5, newScale));
    
    setScale(limitedScale);
    
    // Adjust position based on pointer position to zoom at cursor
    const pointerPos = stage.getPointerPosition();
    const mousePointTo = {
      x: (pointerPos.x - position.x) / oldScale,
      y: (pointerPos.y - position.y) / oldScale,
    };
    
    const newPosition = {
      x: pointerPos.x - mousePointTo.x * limitedScale,
      y: pointerPos.y - mousePointTo.y * limitedScale,
    };
    
    setPosition(newPosition);
  }, [scale, position, setScale, setPosition]);
  
  // Node event handlers
  const handleNodeDragStart = useCallback((e: any) => {
    if (tool !== 'select') return;
    
    const nodeId = e.target.id();
    setSelectedNodeId(nodeId);
    setIsDragging(true);
  }, [tool, setSelectedNodeId]);
  
  const handleNodeDragMove = useCallback((e: any) => {
    if (tool !== 'select' || !isDragging) return;
    
    const nodeId = e.target.id();
    const newPosition = e.target.position();
    
    updateNode(nodeId, {
      x: newPosition.x,
      y: newPosition.y,
    });
  }, [tool, isDragging, updateNode]);
  
  const handleNodeDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  const handleNodeClick = useCallback((nodeId: number) => {
    if (tool === 'select') {
      setSelectedNodeId(nodeId);
      setSelectedConnectionId(null);
    } else if (tool === 'connect') {
      if (connectingNode) {
        // Finish connecting to this node
        finishConnecting(nodeId);
      } else {
        // Start connecting from this node
        setSelectedNodeId(nodeId);
      }
    }
  }, [tool, connectingNode, setSelectedNodeId, setSelectedConnectionId, finishConnecting]);
  
  const handleConnectionClick = useCallback((connectionId: number) => {
    if (tool === 'select') {
      setSelectedNodeId(null);
      setSelectedConnectionId(connectionId);
    }
  }, [tool, setSelectedNodeId, setSelectedConnectionId]);
  
  // Helper function to get connection points between nodes
  const getConnectionPoints = useCallback((source: NodeData, target: NodeData): number[] => {
    // Calculate center points
    const sourceCenter = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
    const targetCenter = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
    
    // Calculate angle between centers
    const angle = Math.atan2(targetCenter.y - sourceCenter.y, targetCenter.x - sourceCenter.x);
    
    // Calculate source edge point
    let sourceX, sourceY, targetX, targetY;
    
    // Handle different node shapes
    if (source.type === 'circle') {
      // For circles, use radius (width/2)
      const radius = source.width / 2;
      sourceX = sourceCenter.x + Math.cos(angle) * radius;
      sourceY = sourceCenter.y + Math.sin(angle) * radius;
    } else {
      // For rectangles and other shapes, find intersection with edge
      // This is a simplified approach that approximates the edge
      const halfWidth = source.width / 2;
      const halfHeight = source.height / 2;
      
      // Calculate slopes
      const absSlope = Math.abs(Math.tan(angle));
      
      if (absSlope <= halfWidth / halfHeight) {
        // Intersection with right/left edge
        sourceX = sourceCenter.x + Math.sign(Math.cos(angle)) * halfWidth;
        sourceY = sourceCenter.y + Math.tan(angle) * Math.sign(Math.cos(angle)) * halfWidth;
      } else {
        // Intersection with top/bottom edge
        sourceX = sourceCenter.x + Math.cot(angle) * Math.sign(Math.sin(angle)) * halfHeight;
        sourceY = sourceCenter.y + Math.sign(Math.sin(angle)) * halfHeight;
      }
    }
    
    // Calculate target edge point using the same approach
    if (target.type === 'circle') {
      const radius = target.width / 2;
      targetX = targetCenter.x - Math.cos(angle) * radius;
      targetY = targetCenter.y - Math.sin(angle) * radius;
    } else {
      const halfWidth = target.width / 2;
      const halfHeight = target.height / 2;
      
      const absSlope = Math.abs(Math.tan(angle));
      
      if (absSlope <= halfWidth / halfHeight) {
        targetX = targetCenter.x - Math.sign(Math.cos(angle)) * halfWidth;
        targetY = targetCenter.y - Math.tan(angle) * Math.sign(Math.cos(angle)) * halfWidth;
      } else {
        targetX = targetCenter.x - Math.cot(angle) * Math.sign(Math.sin(angle)) * halfHeight;
        targetY = targetCenter.y - Math.sign(Math.sin(angle)) * halfHeight;
      }
    }
    
    // Create a curved path between the two points
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2 + 20; // Add some curvature
    
    return [sourceX, sourceY, midX, midY, targetX, targetY];
  }, []);
  
  return {
    stageRef,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    handleStageClick,
    handleWheel,
    handleNodeDragStart,
    handleNodeDragMove,
    handleNodeDragEnd,
    handleNodeClick,
    handleConnectionClick,
    getConnectionPoints,
    isDragging,
    pointerPosition,
  };
}

export default useCanvasOperations;
