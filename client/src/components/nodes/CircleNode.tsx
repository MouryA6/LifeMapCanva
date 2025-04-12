import React from 'react';
import { Group, Circle, Text } from 'react-konva';
import { Node } from '@shared/schema'; // Ensure Node is correctly imported from '@shared/schema'

interface CircleNodeProps {
  node: Node; // Updated type
  isSelected: boolean;
  draggable: boolean;
  onClick: () => void;
  onDragStart: (e: any) => void;
  onDragMove: (e: any) => void;
  onDragEnd: (e: any) => void;
}

const CircleNode: React.FC<CircleNodeProps> = ({
  node,
  isSelected,
  draggable,
  onClick,
  onDragStart,
  onDragMove,
  onDragEnd
}) => {
  const radius = node.width / 2;
  
  return (
    <Group
      x={node.x + radius}
      y={node.y + radius}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onClick={() => {
        console.debug(`CircleNode clicked with ID: ${node.id}`);
        onClick();
      }}
      onTap={onClick}
      id={node.id.toString()}
    >
      <Circle
        radius={radius}
        fill="#1A1A1A"
        stroke={node.borderColor}
        strokeWidth={2}
        shadowColor="black"
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={0.6}
        shadowOffsetX={0}
        shadowOffsetY={0}
      />
      <Text
        text={node.text}
        fontSize={16}
        fontFamily="Poppins, sans-serif"
        fontStyle="600"
        fill="#FAFAFA"
        width={radius * 1.5}
        align="center"
        verticalAlign="middle"
        offsetX={radius * 0.75}
        offsetY={8}
      />
    </Group>
  );
};

export default CircleNode;
