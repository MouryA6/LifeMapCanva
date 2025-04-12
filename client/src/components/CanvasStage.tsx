import { useEffect, useState } from "react";
import { Stage, Layer, Rect, Circle, Arrow, Text, Group, Line, Ellipse } from "react-konva";
import { CanvasMode, Position } from "@/lib/types";
import { NodeType, Connection, Node as SchemaNode } from "@shared/schema";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { getShapeDrawer, createCustomShape } from "@/lib/shapeUtils";
import { 
  calculateConnectionPoints, 
  generateBezierPoints, 
  calculateArrowHead 
} from "@/lib/canvasUtils";

interface CanvasStageProps {
  nodes: SchemaNode[];
  connections: Connection[];
  scale: number;
  position: Position;
  mode: CanvasMode;
  isDrawingConnection: boolean;
  connectionStartNode: string | null;
  selectedNodeId: string | null;
  stageRef: React.RefObject<any>;
  onMouseDown: (e: KonvaEventObject<MouseEvent>) => void;
  onMouseMove: (e: KonvaEventObject<MouseEvent>) => void;
  onMouseUp: (e: KonvaEventObject<MouseEvent>) => void;
  onDragNode: (id: string, pos: Position) => void;
  onSelectNode: (id: string | null) => void;
}

export default function CanvasStage({
  nodes,
  connections,
  scale,
  position,
  mode,
  isDrawingConnection,
  connectionStartNode,
  selectedNodeId,
  stageRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onDragNode,
  onSelectNode,
}: CanvasStageProps) {
  // Track mouse position for connection drawing
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  
  // Store temporary connection points when drawing
  const [tempConnectionPoints, setTempConnectionPoints] = useState<number[]>([]);

  // Update temporary connection when drawing
  useEffect(() => {
    if (isDrawingConnection && connectionStartNode) {
      const startNode = nodes.find((n) => n.id === connectionStartNode);
      if (startNode) {
        const startCenter = {
          x: startNode.x + startNode.width / 2,
          y: startNode.y + startNode.height / 2,
        };
        
        // Generate a bezier curve from the node center to the mouse position
        const points = generateBezierPoints(startCenter, mousePos);
        setTempConnectionPoints(points);
      }
    } else {
      setTempConnectionPoints([]);
    }
  }, [isDrawingConnection, connectionStartNode, mousePos, nodes]);

  // Handle stage mouse move to track mouse position
  const handleStageMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (pos) {
      setMousePos({
        x: (pos.x - position.x) / scale,
        y: (pos.y - position.y) / scale,
      });
    }
    onMouseMove(e);
  };

  // Render a grid background
  const gridSize = 20;
  const gridColor = "#232323";
  const stageWidth = window.innerWidth;
  const stageHeight = window.innerHeight;
  
  // Calculate grid lines
  const gridLines = [];
  const numHorizontalLines = Math.ceil(stageHeight / gridSize);
  const numVerticalLines = Math.ceil(stageWidth / gridSize);

  // Create horizontal grid lines
  for (let i = 0; i <= numHorizontalLines; i++) {
    gridLines.push(
      <Line
        key={`h-${i}`}
        points={[0, i * gridSize, stageWidth, i * gridSize]}
        stroke={gridColor}
        strokeWidth={0.5}
      />
    );
  }

  // Create vertical grid lines
  for (let i = 0; i <= numVerticalLines; i++) {
    gridLines.push(
      <Line
        key={`v-${i}`}
        points={[i * gridSize, 0, i * gridSize, stageHeight]}
        stroke={gridColor}
        strokeWidth={0.5}
      />
    );
  }

  return (
    <div className="absolute inset-0 mt-12 canvas-grid">
      <Stage
        ref={stageRef}
        width={window.innerWidth - 80}
        height={window.innerHeight}
        onMouseDown={onMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={onMouseUp}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
      >
        {/* Grid Layer */}
        <Layer>
          {gridLines}
        </Layer>

        {/* Connections Layer */}
        <Layer>
          {connections.map((connection) => {
            // Find the connected nodes
            const fromNode = nodes.find((n) => n.id === connection.from);
            const toNode = nodes.find((n) => n.id === connection.to);
            
            if (!fromNode || !toNode) return null;
            
            // Calculate connection points if not already calculated
            let points = connection.points;
            if (!points) {
              const { start, end } = calculateConnectionPoints(fromNode, toNode);
              points = generateBezierPoints(start, end);
            }
            
            // Calculate arrow head angle
            const lastIndex = points.length - 1;
            const dx = points[lastIndex - 1] - points[lastIndex - 3];
            const dy = points[lastIndex] - points[lastIndex - 2];
            const angle = Math.atan2(dy, dx);
            
            const arrowHeadPoints = calculateArrowHead(
              { x: points[lastIndex - 1], y: points[lastIndex] },
              angle
            );
            
            return (
              <Group key={connection.id}>
                {/* Connection line */}
                <Arrow
                  points={points}
                  stroke={connection.color}
                  strokeWidth={2}
                  tension={0.5}
                  fill={connection.color}
                  pointerLength={10}
                  pointerWidth={8}
                  bezier
                />
              </Group>
            );
          })}
          
          {/* Temporary connection line while drawing */}
          {isDrawingConnection && tempConnectionPoints.length > 0 && (
            <Arrow
              points={tempConnectionPoints}
              stroke="#4CAF50"
              strokeWidth={2}
              tension={0.5}
              fill="#4CAF50"
              pointerLength={10}
              pointerWidth={8}
              bezier
            />
          )}
        </Layer>

        {/* Nodes Layer */}
        <Layer>
          {nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            
            let shapeElement;
            
            // Create the appropriate shape based on node type
            if (node.type === NodeType.RECTANGLE) {
              shapeElement = (
                <Rect
                  x={0}
                  y={0}
                  width={node.width}
                  height={node.height}
                  stroke={node.borderColor}
                  strokeWidth={node.borderWidth}
                  fill={node.backgroundColor}
                />
              );
            } else if (node.type === NodeType.CIRCLE) {
              shapeElement = (
                <Circle
                  x={node.width / 2}
                  y={node.height / 2}
                  radius={Math.min(node.width, node.height) / 2}
                  stroke={node.borderColor}
                  strokeWidth={node.borderWidth}
                  fill={node.backgroundColor}
                />
              );
            } else if (node.type === NodeType.CLOUD) {
              // Use a simplified shape for cloud (ellipse/oval) as a workaround
              shapeElement = (
                <Ellipse
                  x={node.width / 2}
                  y={node.height / 2}
                  radiusX={node.width * 0.45}
                  radiusY={node.height * 0.45}
                  stroke={node.borderColor}
                  strokeWidth={node.borderWidth}
                  fill={node.backgroundColor}
                />
              );
            }
            
            // Create an outline if the node is selected
            const outlineElement = isSelected && (
              node.type === NodeType.RECTANGLE ? (
                <Rect
                  x={-3}
                  y={-3}
                  width={node.width + 6}
                  height={node.height + 6}
                  stroke={node.borderColor}
                  strokeWidth={2}
                />
              ) : node.type === NodeType.CIRCLE ? (
                <Circle
                  x={node.width / 2}
                  y={node.height / 2}
                  radius={Math.min(node.width, node.height) / 2 + 3}
                  stroke={node.borderColor}
                  strokeWidth={2}
                />
              ) : (
                // Cloud outline approximation
                <Rect
                  x={-3}
                  y={-3}
                  width={node.width + 6}
                  height={node.height + 6}
                  stroke={node.borderColor}
                  strokeWidth={2}
                  cornerRadius={30}
                />
              )
            );
            
            return (
              <Group
                key={node.id}
                x={node.x}
                y={node.y}
                draggable={mode === CanvasMode.SELECT}
                onDragStart={() => {
                  onSelectNode(node.id);
                }}
                onDragMove={(e: KonvaEventObject<DragEvent>) => {
                  const newPosition = {
                    x: e.target.x(),
                    y: e.target.y(),
                  };
                  onDragNode(node.id, newPosition);
                }}
                onClick={() => {
                  if (mode === CanvasMode.SELECT) {
                    onSelectNode(node.id);
                  }
                }}
              >
                {/* Selected outline */}
                {outlineElement}
                
                {/* Main shape */}
                {shapeElement}
                
                {/* Text content */}
                <Text
                  text={node.text}
                  width={node.width}
                  height={node.height}
                  align="center"
                  verticalAlign="middle"
                  fill="white"
                  fontSize={14}
                  fontStyle="bold"
                  padding={5}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
