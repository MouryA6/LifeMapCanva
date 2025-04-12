import { useCallback, useState, useRef, MutableRefObject } from 'react';
import { useCanvas } from '@/components/ui/canvas-context';
import { Node, Connection } from '@shared/schema';

interface UseCanvasReturn {
  stageRef: MutableRefObject<any>;
  handleStageMouseDown: (e: any) => void;
  handleStageMouseMove: (e: any) => void;
  handleStageMouseUp: () => void;
  handleStageClick: (e: any) => void;
  handleWheel: (e: any) => void;
  handleNodeDragStart: (e: any) => void;
  handleNodeDragMove: (e: any) => void;
  handleNodeDragEnd: () => void;
  handleNodeClick: (nodeId: number) => void;
  handleConnectionClick: (connectionId: number) => void;
  getConnectionPoints: (source: Node, target: Node) => number[];
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
  const getConnectionPoints = useCallback((source: Node, target: Node): number[] => {
    console.log('Calculating connection points for source:', source, 'and target:', target);

    const calculateEdgePoint = (center: { x: number; y: number }, angle: number, dimensions: { width: number; height: number }, type: string) => {
      if (type === 'circle') {
        const radius = dimensions.width / 2;
        return {
          x: center.x + Math.cos(angle) * radius,
          y: center.y + Math.sin(angle) * radius,
        };
      } else {
        const halfWidth = dimensions.width / 2;
        const halfHeight = dimensions.height / 2;
        const absSlope = Math.abs(Math.tan(angle));

        if (absSlope <= halfWidth / halfHeight) {
          return {
            x: center.x + Math.sign(Math.cos(angle)) * halfWidth,
            y: center.y + Math.tan(angle) * Math.sign(Math.cos(angle)) * halfWidth,
          };
        } else {
          return {
            x: center.x + (1 / Math.tan(angle)) * Math.sign(Math.sin(angle)) * halfHeight,
            y: center.y + Math.sign(Math.sin(angle)) * halfHeight,
          };
        }
      }
    };

    const sourceCenter = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
    const targetCenter = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
    const angle = Math.atan2(targetCenter.y - sourceCenter.y, targetCenter.x - sourceCenter.x);

    const sourceEdge = calculateEdgePoint(sourceCenter, angle, { width: source.width, height: source.height }, source.type);
    const targetEdge = calculateEdgePoint(targetCenter, angle + Math.PI, { width: target.width, height: target.height }, target.type);

    const midX = (sourceEdge.x + targetEdge.x) / 2;
    const midY = (sourceEdge.y + targetEdge.y) / 2 + 20;

    console.log('Connection points calculated:', [sourceEdge.x, sourceEdge.y, midX, midY, targetEdge.x, targetEdge.y]);

    return [sourceEdge.x, sourceEdge.y, midX, midY, targetEdge.x, targetEdge.y];
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
