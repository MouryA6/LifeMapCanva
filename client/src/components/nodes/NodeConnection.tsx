import React from 'react';
import { Group, Arrow, Text } from 'react-konva';
import { Connection } from '@shared/schema';

interface NodeConnectionProps {
  connection: Connection;
  points: number[];
  isSelected: boolean;
  onClick: () => void;
  onEdit: (connectionId: string) => void; // New property for editing
  onDelete: (connectionId: string) => void; // New property for deleting
}

const NodeConnection: React.FC<NodeConnectionProps> = ({
  connection,
  points,
  isSelected,
  onClick,
  onEdit,
  onDelete
}) => {
  return (
    <Group
      onClick={onClick}
      onTap={onClick}
    >
      <Arrow
        points={points}
        tension={0.5}
        stroke={connection.color}
        fill={connection.color}
        strokeWidth={isSelected ? 3 : 2}
        pointerLength={8}
        pointerWidth={8}
        shadowColor="black"
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={0.6}
        shadowOffsetX={0}
        shadowOffsetY={0}
      />
      {isSelected && (
        <Group>
          <Text
            text="Edit"
            fontSize={12}
            fill="white"
            onClick={() => onEdit(connection.id)}
            x={points[2] - 20}
            y={points[3] - 20}
          />
          <Text
            text="Delete"
            fontSize={12}
            fill="red"
            onClick={() => onDelete(connection.id)}
            x={points[2] + 20}
            y={points[3] - 20}
          />
        </Group>
      )}
    </Group>
  );
};

export default NodeConnection;
