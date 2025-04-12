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
    
    addNode,
    updateNode,
  } = useCanvas();
  
  const {
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
    pointerPosition,
  } = useCanvasOperations();
  
  // Handle stage double click to add a new node
  const handleStageDblClick = (e: any) => {
    if (tool !== 'select') return;
    
    const stage = stageRef.current;
    const pointerPos = stage.getPointerPosition();
    
    // Convert from screen coordinates to stage coordinates
    const x = (pointerPos.x - position.x) / scale;
    const y = (pointerPos.y - position.y) / scale;
    
    // Create new node based on selected node type
    let width = 100;
    let height = 50;
    
    if (nodeType === 'circle') {
      width = 60;
      height = 60;
    } else if (nodeType === 'cloud') {
      width = 160;
      height = 80;
    }
    
    addNode({
      type: nodeType,
      title: 'New node',
      description: '',
      x: x - width / 2,
      y: y - height / 2,
      width,
      height,
      color: '#4CAF50',
      data: {}
    });
  };
  
  // Handle zoom controls
  const handleZoomIn = () => {
    const newScale = Math.min(scale * 1.2, 5);
    
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
  
  const handleZoomOut = () => {
    const newScale = Math.max(scale / 1.2, 0.1);
    
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
    
    // Calculate bounds of all nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    canvas.nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });
    
    // Add padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    const canvasWidth = maxX - minX;
    const canvasHeight = maxY - minY;
    
    // Calculate scale to fit
    const scaleX = width / canvasWidth;
    const scaleY = height / canvasHeight;
    const newScale = Math.min(scaleX, scaleY, 1); // Cap at 1x zoom
    
    // Calculate position to center the content
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
  
  // Draw temporary connection line when creating a connection
  const renderTempConnection = () => {
    if (!connectingNode || !pointerPosition || !canvas) return null;
    
    const sourceNode = canvas.nodes.find(node => node.id === connectingNode.id);
    if (!sourceNode) return null;
    
    // Calculate start point (center of source node)
    const startX = sourceNode.x + sourceNode.width / 2;
    const startY = sourceNode.y + sourceNode.height / 2;
    
    // End point is the current mouse position
    const endX = pointerPosition.x;
    const endY = pointerPosition.y;
    
    // Create a curved line
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2 + 20; // Add curvature
    
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
            {/* Background Grid is handled via CSS */}
            
            {/* Connections */}
            {canvas?.connections.map(connection => {
              const sourceNode = canvas.nodes.find(n => n.id === connection.sourceId);
              const targetNode = canvas.nodes.find(n => n.id === connection.targetId);
              
              if (!sourceNode || !targetNode) return null;
              
              const points = getConnectionPoints(sourceNode, targetNode);
              
              return (
                <NodeConnection
                  key={`connection-${connection.id}`}
                  connection={connection}
                  points={points}
                  isSelected={selectedConnectionId === connection.id}
                  onClick={() => handleConnectionClick(connection.id)}
                />
              );
            })}
            
            {/* Temporary connection line when connecting nodes */}
            {renderTempConnection()}
            
            {/* Nodes */}
            {canvas?.nodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              
              const commonProps = {
                key: `node-${node.id}`,
                node,
                isSelected,
                draggable: tool === 'select',
                onClick: () => handleNodeClick(node.id),
                onDragStart: handleNodeDragStart,
                onDragMove: handleNodeDragMove,
                onDragEnd: handleNodeDragEnd,
              };
              
              switch (node.type) {
                case 'circle':
                  return <CircleNode {...commonProps} />;
                case 'rectangle':
                  return <RectangleNode {...commonProps} />;
                case 'cloud':
                  return <CloudNode {...commonProps} />;
                default:
                  return null;
              }
            })}
          </Layer>
        </Stage>
      </div>
      
      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 rounded-lg p-1 flex flex-col bg-[#1E1E1E] bg-opacity-80 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={handleZoomIn} className="p-2 hover:bg-[#333] rounded-md">
          <Plus className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleZoomOut} className="p-2 hover:bg-[#333] rounded-md">
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
