import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow';

export const ModernEdge = ({
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
        <>
            <path
                id={id}
                style={{ ...style, stroke: style.stroke || '#94a3b8', strokeWidth: style.strokeWidth || 1.5, fill: 'none' }}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd}
            />
            {/* Invisible wider path for easier clicking/hovering */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={15}
                className="react-flow__edge-interaction cursor-pointer"
            />
        </>
    );
};
