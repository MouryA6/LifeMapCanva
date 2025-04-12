import React from 'react';
import { Group, Path, Text } from 'react-konva';
import { Node as BaseNode } from '@shared/schema';

interface Node extends BaseNode {
  title: string; // Add required title property
  description?: string; // Add optional description property
  color: string; // Add required color property
}

interface CloudNodeProps {
  node: Node;
  isSelected: boolean;
  draggable: boolean;
  onClick: () => void;
  onDragStart: (e: any) => void;
  onDragMove: (e: any) => void;
  onDragEnd: (e: any) => void;
}

const CloudNode: React.FC<CloudNodeProps> = ({
  node,
  isSelected,
  draggable,
  onClick,
  onDragStart,
  onDragMove,
  onDragEnd
}) => {
  // Create cloud path relative to node width and height
  const generateCloudPath = () => {
    const w = node.width / 2;
    const h = node.height / 2;
    
    return `M-${w},0 C-${w},-15 -${w * 0.7},-${h} -${w * 0.4},-${h} C-${w * 0.3},-${h * 1.5} 0,-${h * 1.5} ${w * 0.1},-${h} C${w * 0.4},-${h * 1.3} ${w * 0.7},-${h} ${w * 0.7},-${h / 2} C${w},-${h / 2} ${w},0 ${w * 0.7},${h / 3} C${w * 0.9},${h * 0.7} ${w * 0.7},${h} ${w * 0.4},${h} C${w * 0.3},${h * 1.5} 0,${h * 1.5} -${w * 0.1},${h} C-${w * 0.4},${h * 1.2} -${w * 0.9},${h * 0.7} -${w * 0.8},${h / 6} C-${w},${h / 6} -${w * 1.1},-${h / 6} -${w},0 Z`;
  };
  
  const lines = [];
  
  // Split text into lines if description exists
  if (node.description) {
    lines.push(node.title);
    lines.push(node.description);
  } else {
    lines.push(node.title);
  }
  
  return (
    <Group
      x={node.x + node.width / 2}
      y={node.y + node.height / 2}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onClick={() => {
        console.debug(`CloudNode clicked with ID: ${node.id}`);
        onClick();
      }}
      onTap={onClick}
      id={node.id.toString()}
    >
      <Path
        data={generateCloudPath()}
        fill="#1A1A1A"
        stroke={node.color}
        strokeWidth={2}
        shadowColor="black"
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={0.6}
        shadowOffsetX={0}
        shadowOffsetY={0}
      />
      
      {lines.length === 1 ? (
        // Single line centered text
        <Text
          text={lines[0]}
          fontSize={14}
          fontFamily="Poppins, sans-serif"
          fontStyle="600"
          fill="#FAFAFA"
          width={node.width * 0.8}
          align="center"
          verticalAlign="middle"
          offsetX={node.width * 0.4}
          offsetY={0}
        />
      ) : (
        // Title and description
        <Group>
          <Text
            text={lines[0]} // Title
            fontSize={12}
            fontFamily="Poppins, sans-serif"
            fontStyle="500"
            fill="#FAFAFA"
            width={node.width * 0.8}
            align="center"
            offsetX={node.width * 0.4}
            offsetY={15}
          />
          <Text
            text={lines[1]} // Description
            fontSize={14}
            fontFamily="Poppins, sans-serif"
            fontStyle="600"
            fill="#FAFAFA"
            width={node.width * 0.8}
            align="center"
            offsetX={node.width * 0.4}
            offsetY={-5}
          />
        </Group>
      )}
    </Group>
  );
};

export default CloudNode;
