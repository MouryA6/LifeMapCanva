import React from 'react';
import { Group, Arrow } from 'react-konva';
import { ConnectionData } from '@shared/schema';

interface NodeConnectionProps {
  connection: ConnectionData;
  points: number[];
  isSelected: boolean;
  onClick: () => void;
}

const NodeConnection: React.FC<NodeConnectionProps> = ({
  connection,
  points,
  isSelected,
  onClick
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
    </Group>
  );
};

export default NodeConnection;
