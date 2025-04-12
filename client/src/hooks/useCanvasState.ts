import { useState, useCallback, useRef } from "react";
import { Node, Connection, NodeType, ConnectionColor } from "@shared/schema";
import { 
  CanvasState, 
  CanvasMode, 
  Position 
} from "@/lib/types";
import { 
  createNewNode, 
  createNewConnection, 
  isPositionInsideNode,
  calculateConnectionPoints,
  generateBezierPoints,
} from "@/lib/canvasUtils";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";

export function useCanvasState() {
  const { toast } = useToast();
  const [state, setState] = useState<CanvasState>({
    nodes: [],
    connections: [],
    scale: 1,
    position: { x: 0, y: 0 },
    selectedNodeId: null,
    selectedConnectionId: null,
    mode: CanvasMode.SELECT,
    isDrawingConnection: false,
    connectionStartNode: null,
    activeColor: ConnectionColor.GREEN,
  });
  
  const stageRef = useRef<any>(null);
  const isDragging = useRef(false);
  const lastPosition = useRef<Position>({ x: 0, y: 0 });

  // Helper to update node state
  const updateNode = useCallback((nodeId: string, updates: Partial<Node>) => {
    setState((prevState) => ({
      ...prevState,
      nodes: prevState.nodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    }));
  }, []);

  // Helper to update connection state
  const updateConnection = useCallback((connectionId: string, updates: Partial<Connection>) => {
    setState((prevState) => ({
      ...prevState,
      connections: prevState.connections.map((connection) =>
        connection.id === connectionId ? { ...connection, ...updates } : connection
      ),
    }));
  }, []);

  // Add a new node
  const addNode = useCallback((node: Partial<Node>) => {
    const newNode: Node = {
      id: uuidv4(),
      type: node.type || NodeType.RECTANGLE,
      x: node.x || 0,
      y: node.y || 0,
      width: node.width || 120,
      height: node.height || 80,
      text: node.text || "",
      borderColor: node.borderColor || "#4CAF50",
      borderWidth: node.borderWidth || 2,
      backgroundColor: node.backgroundColor || "transparent",
      isSelected: false,
      isDragging: false,
    };

    setState((prevState) => ({
      ...prevState,
      nodes: [...prevState.nodes, newNode],
      selectedNodeId: newNode.id,
    }));

    return newNode.id;
  }, []);

  // Delete a node and its connections
  const deleteNode = useCallback((nodeId: string) => {
    setState((prevState) => {
      // Filter out any connections to/from this node
      const filteredConnections = prevState.connections.filter(
        (conn) => conn.from !== nodeId && conn.to !== nodeId
      );

      return {
        ...prevState,
        nodes: prevState.nodes.filter((node) => node.id !== nodeId),
        connections: filteredConnections,
        selectedNodeId: null,
      };
    });
  }, []);

  // Add a connection between nodes
  const addConnection = useCallback((fromNodeId: string, toNodeId: string) => {
    // Silently fail if trying to connect a node to itself
    if (fromNodeId === toNodeId) {
      return;
    }

    // Silently fail if the connection already exists
    const existingConnection = state.connections.find(
      (conn) => conn.from === fromNodeId && conn.to === toNodeId
    );

    if (existingConnection) {
      return;
    }

    const newConnection = createNewConnection(fromNodeId, toNodeId, state.activeColor);

    setState((prevState) => {
      // Find the nodes to calculate connection points
      const fromNode = prevState.nodes.find((n) => n.id === fromNodeId);
      const toNode = prevState.nodes.find((n) => n.id === toNodeId);

      if (!fromNode || !toNode) return prevState;

      const { start, end } = calculateConnectionPoints(fromNode, toNode);
      const points = generateBezierPoints(start, end);

      const updatedConnection = {
        ...newConnection,
        points,
      };

      return {
        ...prevState,
        connections: [...prevState.connections, updatedConnection],
        selectedConnectionId: updatedConnection.id,
        isDrawingConnection: false,
        connectionStartNode: null,
      };
    });
  }, [state.connections, state.activeColor, toast]);

  // Delete a connection
  const deleteConnection = useCallback((connectionId: string) => {
    setState((prevState) => ({
      ...prevState,
      connections: prevState.connections.filter((conn) => conn.id !== connectionId),
      selectedConnectionId: null,
    }));
  }, []);

  // Set the active tool/mode
  const setMode = useCallback((mode: CanvasMode) => {
    setState((prevState) => ({
      ...prevState,
      mode,
      selectedNodeId: null,
      selectedConnectionId: null,
      isDrawingConnection: mode === CanvasMode.CONNECT,
    }));
  }, []);

  // Select a node
  const selectNode = useCallback((nodeId: string | null) => {
    setState((prevState) => {
      // Deselect all nodes first
      const updatedNodes = prevState.nodes.map((node) => ({
        ...node,
        isSelected: node.id === nodeId,
      }));

      return {
        ...prevState,
        nodes: updatedNodes,
        selectedNodeId: nodeId,
        selectedConnectionId: null,
      };
    });
  }, []);

  // Select a connection
  const selectConnection = useCallback((connectionId: string | null) => {
    setState((prevState) => ({
      ...prevState,
      selectedConnectionId: connectionId,
      selectedNodeId: null,
    }));
  }, []);

  // Handle mouse down on canvas
  const handleCanvasMouseDown = useCallback((e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    const transformedPos = {
      x: (pos.x - state.position.x) / state.scale,
      y: (pos.y - state.position.y) / state.scale,
    };

    // If right-click, show context menu
    if (e.evt.button === 2) {
      e.evt.preventDefault();
      // Set position for context menu
      // This would be implemented in the ContextMenu component
      return;
    }

    // Check if clicked on a node
    let clickedOnNode = false;
    for (const node of state.nodes) {
      if (isPositionInsideNode(transformedPos, node)) {
        clickedOnNode = true;
        
        if (state.mode === CanvasMode.SELECT) {
          // Select the node
          selectNode(node.id);
          
          // Start dragging
          isDragging.current = true;
          lastPosition.current = transformedPos;
        } else if (state.mode === CanvasMode.CONNECT) {
          // Start drawing a connection from this node and also select the node 
          // so its properties are shown in the properties panel
          setState((prevState) => ({
            ...prevState,
            isDrawingConnection: true,
            connectionStartNode: node.id,
            selectedNodeId: node.id, // Select the node too
          }));
        }
        
        break;
      }
    }

    // If not clicked on a node and in select mode, deselect everything
    if (!clickedOnNode) {
      if (state.mode === CanvasMode.SELECT) {
        selectNode(null);
        selectConnection(null);
      } else if (
        [CanvasMode.RECTANGLE, CanvasMode.CIRCLE, CanvasMode.CLOUD].includes(state.mode)
      ) {
        // Create a new node at this position
        const nodeType = state.mode === CanvasMode.RECTANGLE 
          ? NodeType.RECTANGLE 
          : state.mode === CanvasMode.CIRCLE 
            ? NodeType.CIRCLE 
            : NodeType.CLOUD;
        
        const newNode = createNewNode(nodeType, transformedPos);
        addNode(newNode);
        
        // Switch back to select mode after creating a node
        setMode(CanvasMode.SELECT);
      }
    }
  }, [state.mode, state.nodes, state.scale, state.position, addNode, selectNode, selectConnection, setMode]);

  // Handle mouse move on canvas
  const handleCanvasMouseMove = useCallback((e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    const transformedPos = {
      x: (pos.x - state.position.x) / state.scale,
      y: (pos.y - state.position.y) / state.scale,
    };

    if (isDragging.current && state.selectedNodeId) {
      // Calculate delta and update node position
      const deltaX = transformedPos.x - lastPosition.current.x;
      const deltaY = transformedPos.y - lastPosition.current.y;
      
      updateNode(state.selectedNodeId, {
        x: state.nodes.find((n) => n.id === state.selectedNodeId)!.x + deltaX,
        y: state.nodes.find((n) => n.id === state.selectedNodeId)!.y + deltaY,
        isDragging: true,
      });
      
      // Update connections for this node
      setState((prevState) => {
        const affectedConnections = prevState.connections.filter(
          (conn) => conn.from === state.selectedNodeId || conn.to === state.selectedNodeId
        );
        
        if (affectedConnections.length === 0) return prevState;
        
        const updatedConnections = prevState.connections.map((conn) => {
          if (conn.from !== state.selectedNodeId && conn.to !== state.selectedNodeId) {
            return conn;
          }
          
          const fromNode = prevState.nodes.find((n) => n.id === conn.from)!;
          const toNode = prevState.nodes.find((n) => n.id === conn.to)!;
          
          // If these are the nodes being updated, apply the deltas
          const updatedFromNode = conn.from === state.selectedNodeId
            ? { ...fromNode, x: fromNode.x + deltaX, y: fromNode.y + deltaY }
            : fromNode;
            
          const updatedToNode = conn.to === state.selectedNodeId
            ? { ...toNode, x: toNode.x + deltaX, y: toNode.y + deltaY }
            : toNode;
          
          const { start, end } = calculateConnectionPoints(updatedFromNode, updatedToNode);
          const points = generateBezierPoints(start, end);
          
          return { ...conn, points };
        });
        
        return {
          ...prevState,
          connections: updatedConnections,
        };
      });
      
      lastPosition.current = transformedPos;
    }
  }, [state.selectedNodeId, state.nodes, state.scale, state.position, updateNode]);

  // Handle mouse up on canvas
  const handleCanvasMouseUp = useCallback((e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    const transformedPos = {
      x: (pos.x - state.position.x) / state.scale,
      y: (pos.y - state.position.y) / state.scale,
    };

    if (isDragging.current && state.selectedNodeId) {
      // Stop dragging
      updateNode(state.selectedNodeId, {
        isDragging: false,
      });
      
      isDragging.current = false;
    }

    if (state.isDrawingConnection && state.connectionStartNode) {
      // Check if mouse is over a node
      for (const node of state.nodes) {
        if (isPositionInsideNode(transformedPos, node)) {
          // Complete the connection
          addConnection(state.connectionStartNode, node.id);
          break;
        }
      }
      
      // Whether we completed a connection or not, reset the connection drawing state
      setState((prevState) => ({
        ...prevState,
        isDrawingConnection: false,
        connectionStartNode: null,
      }));
    }
  }, [state.isDrawingConnection, state.connectionStartNode, state.selectedNodeId, state.nodes, state.scale, state.position, addConnection, updateNode]);

  // Zoom the canvas
  const zoomCanvas = useCallback((factor: number) => {
    setState((prevState) => {
      const newScale = Math.max(0.1, Math.min(3, prevState.scale * factor));
      return {
        ...prevState,
        scale: newScale,
      };
    });
  }, []);

  // Reset zoom
  const resetZoom = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      scale: 1,
      position: { x: 0, y: 0 },
    }));
  }, []);

  // Set active connection color
  const setActiveColor = useCallback((color: ConnectionColor) => {
    setState((prevState) => ({
      ...prevState,
      activeColor: color,
    }));
  }, []);

  return {
    state,
    stageRef,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    updateConnection,
    deleteConnection,
    setMode,
    selectNode,
    selectConnection,
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,
    zoomCanvas,
    resetZoom,
    setActiveColor,
  };
}
