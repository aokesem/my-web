import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';

export const RoughEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) => {
    const [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <path
            id={id}
            style={{ ...style, stroke: '#78716c', strokeWidth: 2, fill: 'none' }}
            className="react-flow__edge-path opacity-60 hover:opacity-100 transition-opacity"
            d={edgePath}
            markerEnd={markerEnd}
        />
    );
};
