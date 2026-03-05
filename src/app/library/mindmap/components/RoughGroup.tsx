import React, { useRef, useState, useEffect } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import rough from 'roughjs';

export const RoughGroup = ({ data, selected, id }: NodeProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [size, setSize] = useState({ width: 400, height: 240 });

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const rc = rough.canvas(canvas);
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw hand-drawn grouping frame based on size
        rc.rectangle(4, 4, size.width - 8, size.height - 8, {
            roughness: 2,
            stroke: selected ? '#0284c7' : '#d4d4d8',
            strokeWidth: selected ? 2.5 : 1.5,
            strokeLineDash: [10, 5], // Dashed sketchy border
            fill: 'rgba(0, 0, 0, 0.01)',
            fillStyle: 'hachure',
        });
    }, [selected, size]);

    return (
        <div className="w-full h-full min-w-[100px] min-h-[100px]">
            <NodeResizer
                isVisible={selected}
                minWidth={100}
                minHeight={60}
                onResize={(evt, params) => setSize({ width: params.width, height: params.height })}
                lineStyle={{ border: '1px solid #7dd3fc', opacity: 0.5 }}
                handleStyle={{
                    width: 14,
                    height: 14,
                    background: '#0284c7',
                    border: '3px solid white',
                    borderRadius: '4px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    margin: '-3px' // Center the larger handle
                }}
            />
            <canvas
                ref={canvasRef}
                width={size.width}
                height={size.height}
                className="absolute inset-0 pointer-events-none"
            />
            <div className="relative z-10 p-2 opacity-30 pointer-events-none select-none">
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-[0.2em]">
                    {data.label || 'GROUP_SECTION'}
                </span>
            </div>
        </div>
    );
};
