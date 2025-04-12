import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  NodeData, ConnectionData, CanvasData, NodeType, ConnectionType
} from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CanvasContextProps {
  canvas: CanvasData | null;
  loading: boolean;
  selectedNodeId: number | null;
  selectedConnectionId: number | null;
  tool: 'select' | 'move' | 'connect';
  nodeType: 'rectangle' | 'circle' | 'cloud';
  scale: number;
  position: { x: number, y: number };
  connectingNode: { id: number } | null;
  
  loadCanvas: (id: number) => Promise<void>;
  createCanvas: (name: string) => Promise<number>;
  saveCanvas: () => Promise<boolean>;
  exportCanvas: () => Promise<boolean>;
  
  setTool: (tool: 'select' | 'move' | 'connect') => void;
  setNodeType: (type: 'rectangle' | 'circle' | 'cloud') => void;
  setSelectedNodeId: (id: number | null) => void;
  setSelectedConnectionId: (id: number | null) => void;
  setScale: (scale: number) => void;
  setPosition: (position: { x: number, y: number }) => void;
  
  addNode: (node: Omit<NodeData, 'id'>) => void;
  updateNode: (id: number, data: Partial<NodeData>) => void;
  deleteNode: (id: number) => void;
  
  startConnecting: (nodeId: number) => void;
  finishConnecting: (targetId: number) => void;
  cancelConnecting: () => void;
  
  addConnection: (connection: Omit<ConnectionData, 'id'>) => void;
  updateConnection: (id: number, data: Partial<ConnectionData>) => void;
  deleteConnection: (id: number) => void;
}

const CanvasContext = createContext<CanvasContextProps | undefined>(undefined);

export const CanvasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [canvas, setCanvas] = useState<CanvasData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [tool, setTool] = useState<'select' | 'move' | 'connect'>('select');
  const [nodeType, setNodeType] = useState<'rectangle' | 'circle' | 'cloud'>('rectangle');
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [connectingNode, setConnectingNode] = useState<{ id: number } | null>(null);
  
  const nextNodeId = useRef<number>(-1);
  const nextConnectionId = useRef<number>(-1);
  const { toast } = useToast();
  
  const loadCanvas = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/canvases/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load canvas');
      }
      const data = await response.json();
      setCanvas(data);
      
      // Find the minimum available ID for new nodes/connections
      let minNodeId = -1;
      let minConnectionId = -1;
      
      data.nodes.forEach((node: NodeData) => {
        minNodeId = Math.min(minNodeId, node.id - 1);
      });
      
      data.connections.forEach((conn: ConnectionData) => {
        minConnectionId = Math.min(minConnectionId, conn.id - 1);
      });
      
      nextNodeId.current = minNodeId;
      nextConnectionId.current = minConnectionId;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load canvas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);
  
  const createCanvas = useCallback(async (name: string): Promise<number> => {
    try {
      const response = await apiRequest('POST', '/api/canvases', { name });
      const data = await response.json();
      return data.id;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create canvas",
        variant: "destructive"
      });
      return -1;
    }
  }, [toast]);
  
  const saveCanvas = useCallback(async (): Promise<boolean> => {
    if (!canvas) return false;
    
    setLoading(true);
    try {
      await apiRequest('PUT', `/api/canvases/${canvas.id}/save`, canvas);
      toast({
        title: "Success",
        description: "Canvas saved successfully",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save canvas",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [canvas, toast]);
  
  const exportCanvas = useCallback(async (): Promise<boolean> => {
    if (!canvas) return false;
    
    try {
      // This is handled in the UI layer by converting the current canvas to SVG
      toast({
        title: "Success",
        description: "Canvas exported successfully",
      });
      return true;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export canvas",
        variant: "destructive"
      });
      return false;
    }
  }, [canvas, toast]);
  
  const addNode = useCallback((node: Omit<NodeData, 'id'>) => {
    if (!canvas) return;
    
    const id = nextNodeId.current--;
    const newNode: NodeData = { ...node, id };
    
    setCanvas(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        nodes: [...prev.nodes, newNode]
      };
    });
  }, [canvas]);
  
  const updateNode = useCallback((id: number, data: Partial<NodeData>) => {
    setCanvas(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        nodes: prev.nodes.map(node => 
          node.id === id ? { ...node, ...data } : node
        )
      };
    });
  }, []);
  
  const deleteNode = useCallback((id: number) => {
    setCanvas(prev => {
      if (!prev) return prev;
      
      // Also delete any connections that involve this node
      const updatedConnections = prev.connections.filter(
        conn => conn.sourceId !== id && conn.targetId !== id
      );
      
      return {
        ...prev,
        nodes: prev.nodes.filter(node => node.id !== id),
        connections: updatedConnections
      };
    });
    
    // If the deleted node was selected, deselect it
    if (selectedNodeId === id) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);
  
  const startConnecting = useCallback((nodeId: number) => {
    setConnectingNode({ id: nodeId });
  }, []);
  
  const finishConnecting = useCallback((targetId: number) => {
    if (!connectingNode || connectingNode.id === targetId || !canvas) {
      setConnectingNode(null);
      return;
    }
    
    // Create a new connection
    const id = nextConnectionId.current--;
    const newConnection: ConnectionData = {
      id,
      sourceId: connectingNode.id,
      targetId,
      type: ConnectionType.SUPPORTS,
      color: '#4CAF50',
    };
    
    setCanvas(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        connections: [...prev.connections, newConnection]
      };
    });
    
    setConnectingNode(null);
  }, [connectingNode, canvas]);
  
  const cancelConnecting = useCallback(() => {
    setConnectingNode(null);
  }, []);
  
  const addConnection = useCallback((connection: Omit<ConnectionData, 'id'>) => {
    if (!canvas) return;
    
    const id = nextConnectionId.current--;
    const newConnection: ConnectionData = { ...connection, id };
    
    setCanvas(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        connections: [...prev.connections, newConnection]
      };
    });
  }, [canvas]);
  
  const updateConnection = useCallback((id: number, data: Partial<ConnectionData>) => {
    setCanvas(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        connections: prev.connections.map(conn => 
          conn.id === id ? { ...conn, ...data } : conn
        )
      };
    });
  }, []);
  
  const deleteConnection = useCallback((id: number) => {
    setCanvas(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        connections: prev.connections.filter(conn => conn.id !== id)
      };
    });
    
    // If the deleted connection was selected, deselect it
    if (selectedConnectionId === id) {
      setSelectedConnectionId(null);
    }
  }, [selectedConnectionId]);
  
  return (
    <CanvasContext.Provider value={{
      canvas,
      loading,
      selectedNodeId,
      selectedConnectionId,
      tool,
      nodeType,
      scale,
      position,
      connectingNode,
      
      loadCanvas,
      createCanvas,
      saveCanvas,
      exportCanvas,
      
      setTool,
      setNodeType,
      setSelectedNodeId,
      setSelectedConnectionId,
      setScale,
      setPosition,
      
      addNode,
      updateNode,
      deleteNode,
      
      startConnecting,
      finishConnecting,
      cancelConnecting,
      
      addConnection,
      updateConnection,
      deleteConnection,
    }}>
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvas = () => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
};
