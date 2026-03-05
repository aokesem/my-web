import React, { useRef, useState, useMemo, useEffect } from 'react';
import { NodeProps, Handle, Position, NodeResizer, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { motion } from 'framer-motion';
import rough from 'roughjs';
import { STYLE_PRESETS } from '../constants';
import { calculateNodeSize } from '../utils';

export const RoughNode = ({ id, data, selected }: NodeProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(data.label || '');
    const { setNodes } = useReactFlow();
    const updateNodeInternals = useUpdateNodeInternals();

    // Get dynamic size (manual override takes priority)
    const { width, height } = useMemo(() => {
        return {
            width: data.width || calculateNodeSize(data.label || '').width,
            height: data.height || calculateNodeSize(data.label || '').height
        };
    }, [data.label, data.width, data.height]);

    // Sync editText with data.label when not editing
    useEffect(() => {
        if (!isEditing) {
            setEditText(data.label || '');
        }
    }, [data.label, isEditing]);

    // Extract styles from data or use defaults
    const activeColor = STYLE_PRESETS.colors.find(c => c.id === data.colorId) || STYLE_PRESETS.colors[0];
    const activeWeight = STYLE_PRESETS.borderWeights.find(w => w.id === data.borderWeightId) || STYLE_PRESETS.borderWeights[0];

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const rc = rough.canvas(canvas);
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw hand-drawn rectangle with dynamic styling and size
        rc.rectangle(2, 2, width - 4, height - 4, {
            roughness: activeWeight.roughness,
            stroke: activeColor.stroke,
            strokeWidth: activeWeight.width,
            fill: activeColor.bg,
            fillStyle: 'hachure',
            fillWeight: 1.5,
            hachureAngle: 65,
            hachureGap: 6,
        });

        if (selected) {
            rc.rectangle(0, 0, width, height, {
                roughness: 2.5,
                stroke: '#0ea5e9',
                strokeWidth: 2,
                strokeLineDash: [5, 5],
            });
        }
    }, [selected, data.colorId, data.borderWeightId, activeColor, activeWeight, width, height]);

    // Handle label update
    const handleSubmit = () => {
        setIsEditing(false);
        if (editText === data.label) return;

        setNodes(nds => nds.map(n => {
            if (n.id === id) {
                return { ...n, data: { ...n.data, label: editText } };
            }
            return n;
        }));

        // Ensure handles are updated after size change
        requestAnimationFrame(() => updateNodeInternals(id));
    };

    return (
        <div
            className="relative group perspective-1000"
            onDoubleClick={() => setIsEditing(true)}
        >
            <NodeResizer
                isVisible={selected && !isEditing}
                minWidth={100}
                minHeight={60}
                onResize={(evt, params) => {
                    setNodes(nds => nds.map(n => n.id === id ? {
                        ...n,
                        data: { ...n.data, width: params.width, height: params.height }
                    } : n));
                }}
                onResizeEnd={() => {
                    updateNodeInternals(id);
                }}
                lineStyle={{ border: '1px solid #7dd3fc', opacity: 0.5 }}
                handleStyle={{
                    width: 10,
                    height: 10,
                    background: '#0284c7',
                    border: '2px solid white',
                    borderRadius: '3px',
                }}
            />
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="absolute inset-0 pointer-events-none"
            />
            <div
                className="relative z-10 flex flex-col items-center justify-center p-4 text-center select-none"
                style={{ width, height }}
            >
                <span className="text-[10px] font-mono text-stone-300 absolute top-2 left-4 uppercase tracking-tighter opacity-40">node_log_0x{data.id}</span>

                <Handle
                    type="target"
                    position={data.layoutDirection === 'LR' ? Position.Left : Position.Top}
                    className="opacity-0 w-2 h-2"
                />

                {isEditing ? (
                    <textarea
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={handleSubmit}
                        onKeyDown={(e) => {
                            // Stop propagation for editing keys to prevent global delete/backspace triggers
                            e.stopPropagation();
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        className="nodrag nowheel w-full bg-transparent border-none focus:ring-0 text-stone-800 text-sm font-serif font-bold text-center resize-none p-0 overflow-hidden leading-tight"
                        style={{ height: 'auto' }}
                    />
                ) : (
                    <h3 className={`font-serif text-stone-800 text-sm leading-tight group-hover:text-sky-600 transition-colors ${data.fontWeight === 'bold' ? 'font-black' : 'font-bold'}`}>
                        {data.label}
                    </h3>
                )}

                <p className="text-[9px] font-mono text-stone-400 mt-1 uppercase tracking-widest opacity-60">
                    {data.type || 'logical_unit'}
                </p>

                <Handle
                    type="source"
                    position={data.layoutDirection === 'LR' ? Position.Right : Position.Bottom}
                    className="opacity-0 w-2 h-2"
                />
            </div>

            {selected && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -right-20 top-0 flex flex-col gap-1 pointer-events-none"
                >
                    <div className="bg-sky-500 text-white text-[8px] font-mono px-1 py-0.5 rounded">SELECTED: TRUE</div>
                    <div className="bg-stone-800 text-white text-[8px] font-mono px-1 py-0.5 rounded">MODE: VECTOR_EDIT</div>
                </motion.div>
            )}
        </div>
    );
};
