import React, { useEffect, useRef } from 'react';
import { Stage, Layer, Group, Arrow } from 'react-konva';
import { useCanvas } from './ui/canvas-context';
import useCanvasOperations from '@/hooks/use-canvas';
import CircleNode from './nodes/CircleNode';
import RectangleNode from './nodes/RectangleNode';
import CloudNode from './nodes/CloudNode';
import NodeConnection from './nodes/NodeConnection';
import { Button } from './ui/button';
import { Plus, Minus, Maximize } from 'lucide-react';
import { Connection as BaseConnection } from '@shared/schema';

// Update Node and Connection interfaces to resolve type mismatches
interface Node {
  id: number; // Changed to number to match NodeData
  x: number;
  y: number;
  width: number;
  height: number;
  type: string; // Changed to string for compatibility
  title?: string; // Ensure title is optional
  position?: { x: number; y: number }; // Added position property for compatibility
  [key: string]: any; // Allow additional properties
}

interface Connection {
  id: number; // Changed to number to match ConnectionData
  sourceId: number;
  targetId: number;
  type: string;
  color: string;
  from?: string; // Optional for compatibility
  to?: string;   // Optional for compatibility
  [key: string]: any; // Allow additional properties
}

// Import the NodeType type from the shared schema
import { NodeType } from '@shared/schema';

export interface CanvasContextProps {
  canvas: CanvasState | null;
  tool: string;
  nodeType: string;
  scale: number;
  position: { x: number; y: number };
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  connectingNode: Node | null;
  addNode: (node: Node) => void;
  updateNode: (id: number, position: { x: number; y: number }) => void;
  setCanvas: (canvas: CanvasState | ((prevCanvas: CanvasState) => CanvasState)) => void;
}

interface CanvasState {
  nodes: Node[]; // Ensure nodes are typed as Node[]
  connections: Connection[];
}

interface CanvasProps {
  width: number;
  height: number;
}

const Canvas: React.FC<CanvasProps> = ({ width, height }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const {
    canvas,
    tool,
    nodeType,
    scale,
    position,
    selectedNodeId,
    selectedConnectionId,
    connectingNode,
    setCanvas,
    addNode,
    updateNode,
  } = useCanvas();

  // Add debug logs to verify Canvas re-rendering
  console.log('Canvas component re-rendered with canvas state:', canvas);
  
  const {
    stageRef,
    handleStageMouseDown,
    handleStageMouseMove,
    handleStageMouseUp,
    handleStageClick,
    handleWheel,
    handleNodeDragStart,
    handleNodeDragEnd,
    handleNodeClick,
    handleConnectionClick,
    getConnectionPoints,
    pointerPosition,
  } = useCanvasOperations();
  
  const handleStageDblClick = (e: any) => {
    if (tool !== 'select') return;

    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();

    const x = (pointerPos.x - position.x) / scale;
    const y = (pointerPos.y - position.y) / scale;

    const dimensions = getNodeDimensions(nodeType);

    addNode({
      type: nodeType,
      title: 'New node',
      description: '',
      x: x - dimensions.width / 2,
      y: y - dimensions.height / 2,
      ...dimensions,
      color: '#4CAF50',
      data: {},
    });
  };

  const getNodeDimensions = (type: string) => {
    switch (type) {
      case 'circle':
        return { width: 60, height: 60 };
      case 'cloud':
        return { width: 160, height: 80 };
      default:
        return { width: 100, height: 50 };
    }
  };

  const handleZoom = (zoomIn: boolean) => {
    const newScale = zoomIn ? Math.min(scale * 1.2, 5) : Math.max(scale / 1.2, 0.1);

    const centerX = width / 2;
    const centerY = height / 2;

    const mousePointTo = {
      x: (centerX - position.x) / scale,
      y: (centerY - position.y) / scale,
    };

    const newPosition = {
      x: centerX - mousePointTo.x * newScale,
      y: centerY - mousePointTo.y * newScale,
    };

    updateStage(newPosition, newScale);
  };

  const handleFitView = () => {
    if (!canvas || canvas.nodes.length === 0) return;
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    canvas.nodes.forEach((node: Node) => {
          minX = Math.min(minX, node.x);
          minY = Math.min(minY, node.y);
          maxX = Math.max(maxX, node.x + node.width);
          maxY = Math.max(maxY, node.y + node.height);
        });
    
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    const canvasWidth = maxX - minX;
    const canvasHeight = maxY - minY;
    
    const scaleX = width / canvasWidth;
    const scaleY = height / canvasHeight;
    const newScale = Math.min(scaleX, scaleY, 1);
    
    const newPosition = {
      x: width / 2 - (minX + canvasWidth / 2) * newScale,
      y: height / 2 - (minY + canvasHeight / 2) * newScale,
    };
    
    updateStage(newPosition, newScale);
  };
  
  const updateStage = (newPosition: { x: number; y: number }, newScale: number) => {
    stageRef.current?.position(newPosition);
    stageRef.current?.scale({ x: newScale, y: newScale });
    stageRef.current?.batchDraw();
  };
  
  const renderTempConnection = () => {
    if (!connectingNode || !pointerPosition || !canvas) return null;
    
    const sourceNode = canvas.nodes.find((node: { id: number; }) => node.id === connectingNode.id);
    if (!sourceNode) return null;
    
    const startX = sourceNode.x + sourceNode.width / 2;
    const startY = sourceNode.y + sourceNode.height / 2;
    
    const endX = pointerPosition.x;
    const endY = pointerPosition.y;
    
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2 + 20;
    
    return (
      <Arrow
        points={[startX, startY, midX, midY, endX, endY]}
        tension={0.5}
        stroke="#4CAF50"
        fill="#4CAF50"
        strokeWidth={2}
        pointerLength={8}
        pointerWidth={8}
        dash={[5, 5]}
      />
    );
  };

  // Add handlers for editing and deleting connections
  const handleEditConnection = (connectionId: number) => {
    console.log('Editing connection with ID:', connectionId);
    // Implement logic to edit the connection (e.g., open a dialog for editing properties)
  };

  const handleDeleteConnection = (connectionId: number) => {
    console.log('Deleting connection with ID:', connectionId);
    if (canvas) {
      const updatedConnections = canvas.connections.filter((connection) => connection.id !== connectionId) as Connection[];
      setCanvas((prevCanvas) => {
        if (!prevCanvas) return null;
        return { ...prevCanvas, connections: updatedConnections };
      });
    }
  };

  // Add debug logs to verify connection points calculation
  interface DebugConnectionPointsParams {
    sourceNode: Node | undefined;
    targetNode: Node | undefined;
  }

  const debugConnectionPoints = (sourceNode: DebugConnectionPointsParams['sourceNode'], targetNode: DebugConnectionPointsParams['targetNode']): number[] | null => {
    if (!sourceNode || !targetNode) {
      console.warn('Missing source or target node for connection points calculation:', { sourceNode, targetNode });
      return null;
    }
    return getConnectionPoints(
      {
        ...sourceNode,
        text: sourceNode.text || '',
        borderColor: sourceNode.borderColor || '#000',
        borderWidth: sourceNode.borderWidth || 1,
        backgroundColor: sourceNode.backgroundColor || '#FFF',
      },
      {
        ...targetNode,
        text: targetNode.text || '',
        borderColor: targetNode.borderColor || '#000',
        borderWidth: targetNode.borderWidth || 1,
        backgroundColor: targetNode.backgroundColor || '#FFF',
      }
    );
  };

  // Update renderConnections to include debug logs
  const renderConnections = () => {
    return canvas?.connections.map((connection) => {
      const sourceNode = canvas.nodes.find((n): n is Node => n.id === connection.sourceId) as Node | undefined;
      const targetNode = canvas.nodes.find((n): n is Node => n.id === connection.targetId) as Node | undefined;

      if (!sourceNode || !targetNode) {
      console.warn('Connection rendering skipped due to missing nodes:', { connection, sourceNode, targetNode });
      return null;
      }

      const points: number[] | null = debugConnectionPoints(
        sourceNode as Node,
        targetNode as Node
      );

      return (
      <NodeConnection
        key={`connection-${connection.id}`}
        connection={connection}
        points={points || []}
        isSelected={selectedConnectionId === connection.id}
        onClick={() => handleConnectionClick(connection.id)}
        onEdit={(id: number) => handleEditConnection(id)}
        onDelete={(id: number) => handleDeleteConnection(id)}
      />
      );
    });
  };

  // Ensure arrows dynamically follow the target node
  const handleNodeDragMove = (e: any) => {
    const nodeId = e.target.attrs.id; // Assuming the node's ID is stored in its attributes
    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };

    console.log('Dragging node with ID:', nodeId, 'New Position:', newPosition);

    // Update the node's position in the canvas state
    updateNode(Number(nodeId), newPosition);

    // Recalculate connection points for all connections dynamically
    if (canvas) {
      const updatedConnections = canvas.connections.map((connection: Connection) => {
        const sourceNode: Node | undefined = canvas.nodes.find((n: Node) => n.id === connection.sourceId);
        const targetNode: Node | undefined = canvas.nodes.find((n: Node) => n.id === connection.targetId);

        if (sourceNode && targetNode) {
          connection.points = getConnectionPoints(
            {
              ...sourceNode,
              text: sourceNode.text || '',
              borderColor: sourceNode.borderColor || '#000',
              borderWidth: sourceNode.borderWidth || 1,
              backgroundColor: sourceNode.backgroundColor || '#FFF',
            },
            {
              ...targetNode,
              text: targetNode.text || '',
              borderColor: targetNode.borderColor || '#000',
              borderWidth: targetNode.borderWidth || 1,
              backgroundColor: targetNode.backgroundColor || '#FFF',
            }
          );
        }
        return connection;
      });

      // Update the canvas state with recalculated connections
      setCanvas((prevCanvas: CanvasState) => ({ ...prevCanvas, connections: updatedConnections }));
    }
  };

  // Add state persistence logic
  useEffect(() => {
    const savedCanvas = localStorage.getItem('canvasState');
    if (savedCanvas) {
      setCanvas(JSON.parse(savedCanvas));
    }
  }, []);

  useEffect(() => {
    if (canvas) {
      localStorage.setItem('canvasState', JSON.stringify(canvas));
    }
  }, [canvas]);
  
  // Update usages of Node and Connection to ensure compatibility
  canvas?.nodes.forEach((node: Node) => {
    // Ensure type compatibility
    const updatedNode: Node = {
      ...node,
      id: Number(node.id), // Convert id to number
      type: node.type, // Ensure type is string
    };
    console.log(updatedNode);
  });

  canvas?.connections.forEach((connection: Connection) => {
    // Ensure type compatibility
    const updatedConnection: Connection = {
      ...connection,
      id: Number(connection.id), // Convert id to number
    };
    console.log(updatedConnection);
  });

  return (
    <div className="flex-1 overflow-hidden relative">
      <div 
        ref={gridRef}
        className="absolute inset-0 bg-black"
        style={{
          backgroundImage: 'linear-gradient(rgba(51, 51, 51, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(51, 51, 51, 0.5) 1px, transparent 1px)',
          backgroundSize: `${40 * scale}px ${40 * scale}px`,
          backgroundPosition: `${position.x % (40 * scale)}px ${position.y % (40 * scale)}px`,
        }}
      >
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onClick={handleStageClick}
          onDblClick={handleStageDblClick}
          onWheel={handleWheel}
          position={position}
          scale={{ x: scale, y: scale }}
          draggable={false}
        >
          <Layer>
            {renderConnections()}
            {renderTempConnection()}
            {canvas?.nodes.map((node: Node) => {
              const isSelected = selectedNodeId === String(node.id);
              
              const commonProps = {
                key: `node-${node.id}`,
                node,
                isSelected,
                draggable: tool === 'select',
                onClick: () => node.id !== null && handleNodeClick(String(node.id)),
                onDragStart: handleNodeDragStart,
                onDragMove: handleNodeDragMove,
                onDragEnd: handleNodeDragEnd,
              };
              
              switch (node.type) {
                case 'circle':
                  return (
                    <CircleNode
                      node={{
                        ...node,
                        id: Number(node.id || 0), // Ensure id is a number
                        x: node.x || 0,
                        y: node.y || 0,
                        width: node.width || 60,
                        height: node.height || 60,
                        text: node.text || '',
                        borderColor: node.borderColor || '#000',
                        borderWidth: node.borderWidth || 1,
                        backgroundColor: node.backgroundColor || '#FFF',
                        type: node.type as NodeType, // Cast type to NodeType
                      }}
                      isSelected={isSelected}
                      draggable={tool === 'select'}
                      onClick={() => node.id !== null && handleNodeClick(String(node.id))}
                      onDragStart={handleNodeDragStart}
                      onDragMove={handleNodeDragMove}
                      onDragEnd={handleNodeDragEnd}
                    />
                  );
                case 'rectangle':
                  return (
                    <RectangleNode
                      {...commonProps}
                      node={{
                        ...node,
                        text: node.text || '',
                        borderColor: node.borderColor || '#000',
                        borderWidth: node.borderWidth || 1,
                        backgroundColor: node.backgroundColor || '#FFF',
                        title: node.title || 'Untitled Node',
                        color: node.color || '#4CAF50',
                      }}
                    />
                  );
                case 'cloud':
                  return (
                    <CloudNode
                      {...commonProps}
                      node={{
                        ...node,
                        text: node.text || '',
                        borderColor: node.borderColor || '#000',
                        borderWidth: node.borderWidth || 1,
                        backgroundColor: node.backgroundColor || '#FFF',
                        title: node.title || 'Untitled Node',
                        color: node.color || '#4CAF50',
                      }}
                    />
                  );
                default:
                  return null;
              }
            })}
          </Layer>
        </Stage>
      </div>
      
      <div className="absolute bottom-4 right-4 rounded-lg p-1 flex flex-col bg-[#1E1E1E] bg-opacity-80 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => handleZoom(true)} className="p-2 hover:bg-[#333] rounded-md">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => handleZoom(false)} className="p-2 hover:bg-[#333] rounded-md">
          <Minus className="h-4 w-4" />
        </Button>
        <div className="border-t border-[#444] my-1"></div>
        <Button variant="ghost" size="icon" onClick={handleFitView} className="p-2 hover:bg-[#333] rounded-md">
          <Maximize className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Canvas;
