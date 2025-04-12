import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { Node } from '@shared/schema';

interface RectangleNodeProps {
  node: Node;
  isSelected: boolean;
  draggable: boolean;
  onClick: () => void;
  onDragStart: (e: any) => void;
  onDragMove: (e: any) => void;
  onDragEnd: (e: any) => void;
}

const RectangleNode: React.FC<RectangleNodeProps> = ({
  node,
  isSelected,
  draggable,
  onClick,
  onDragStart,
  onDragMove,
  onDragEnd
}) => {
  const lines = [];
  
  // Split text into lines if description exists
  if (node.text) {
    lines.push(node.text); // Assuming 'text' is used as the title
    const descriptionLines = node.text.split("\n");
    lines.push(...descriptionLines);
  } else {
    lines.push(node.text); // Use 'text' as a fallback if 'title' is not available
  }
  
  return (
    <Group
      x={node.x}
      y={node.y}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onClick={() => {
        console.debug(`RectangleNode clicked with ID: ${node.id}`);
        onClick();
      }}
      onTap={onClick}
      id={node.id.toString()}
    >
      <Rect
        width={node.width}
        height={node.height}
        cornerRadius={4}
        fill="#1A1A1A"
        stroke={node.borderColor}
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
          fontStyle="500"
          fill="#FAFAFA"
          width={node.width}
          height={node.height}
          align="center"
          verticalAlign="middle"
        />
      ) : (
        // Multiple lines
        <Group>
          <Text
            text={lines[0]} // Title
            fontSize={14}
            fontFamily="Poppins, sans-serif"
            fontStyle="500"
            fill="#FAFAFA"
            width={node.width}
            align="center"
            y={node.height * 0.25 - 8}
          />
          
          {/* Description lines */}
          {lines.slice(1).map((line, i) => (
            <Text
              key={i}
              text={line}
              fontSize={12}
              fontFamily="Poppins, sans-serif"
              fill="#FAFAFA"
              width={node.width}
              align="center"
              y={node.height * 0.25 + 8 + i * 16}
            />
          ))}
        </Group>
      )}
    </Group>
  );
};

export default RectangleNode;
