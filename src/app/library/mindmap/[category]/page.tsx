"use client";

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Panel,
    useNodesState,
    useEdgesState,
    addEdge,
    Handle,
    Position,
    NodeProps,
    EdgeProps,
    getBezierPath,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, MousePointer2, Scan, Info } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import rough from 'roughjs';

// === Custom Hand-drawn Node Component ===
const RoughNode = ({ data, selected }: NodeProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const rc = rough.canvas(canvas);
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw hand-drawn rectangle
        rc.rectangle(2, 2, 196, 76, {
            roughness: 1.5,
            stroke: selected ? '#0284c7' : '#4a4a4a',
            strokeWidth: selected ? 2 : 1.2,
            fill: selected ? 'rgba(2, 132, 199, 0.05)' : 'rgba(255, 255, 255, 0.8)',
            fillStyle: 'hachure',
            fillWeight: 0.5,
            hachureAngle: 60,
            hachureGap: 10
        });
    }, [selected]);

    return (
        <div className="relative group perspective-1000">
            <canvas
                ref={canvasRef}
                width={200}
                height={80}
                className="absolute inset-0 pointer-events-none"
            />
            <div className="relative z-10 w-[200px] h-[80px] flex flex-col items-center justify-center p-4 text-center">
                <span className="text-[10px] font-mono text-stone-300 absolute top-2 left-4 uppercase tracking-tighter opacity-40">node_log_0x{data.id}</span>
                <Handle type="target" position={Position.Top} className="opacity-0" />
                <h3 className="font-serif font-bold text-stone-800 text-sm leading-tight group-hover:text-sky-600 transition-colors">
                    {data.label}
                </h3>
                <p className="text-[9px] font-mono text-stone-400 mt-1 uppercase tracking-widest opacity-60">
                    {data.type || 'logical_unit'}
                </p>
                <Handle type="source" position={Position.Bottom} className="opacity-0" />
            </div>

            {/* Tech Annotation Overlays */}
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

// === Custom Edge Component (Hand-drawn style) ===
const RoughEdge = ({
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
        sourceY: sourceY + 40, // Adjust for node height
        sourcePosition,
        targetX,
        targetY: targetY - 40,
        targetPosition,
    });

    return (
        <>
            <path
                id={id}
                style={style}
                className="react-flow__edge-path fill-none stroke-stone-300 stroke-[1.5px] opacity-40 hover:opacity-100 transition-opacity"
                d={edgePath}
                markerEnd={markerEnd}
            />
        </>
    );
};

const nodeTypes = {
    rough: RoughNode,
};

const edgeTypes = {
    rough: RoughEdge,
};

// === Mock Data for Mind Map ===
const INITIAL_NODES = [
    { id: '1', type: 'rough', position: { x: 400, y: 100 }, data: { id: '01', label: '核心目标: 出行指南', type: 'CORE_ANCHOR' } },
    { id: '2', type: 'rough', position: { x: 150, y: 300 }, data: { id: '02', label: '交通选型: 轨道交通', type: 'LOGISTICS' } },
    { id: '3', type: 'rough', position: { x: 650, y: 300 }, data: { id: '03', label: '住宿定位: 艺术酒店', type: 'LODGING' } },
    { id: '4', type: 'rough', position: { x: 50, y: 500 }, data: { id: '04', label: '路线 A: 沿海步道', type: 'PATH_VAL_01' } },
    { id: '5', type: 'rough', position: { x: 250, y: 500 }, data: { id: '05', label: '路线 B: 城市中心', type: 'PATH_VAL_02' } },
];

const INITIAL_EDGES = [
    { id: 'e1-2', source: '1', target: '2', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#d1d5db' } },
    { id: 'e1-3', source: '1', target: '3', markerEnd: { type: MarkerType.ArrowClosed, color: '#d1d5db' } },
    { id: 'e2-4', source: '2', target: '4', markerEnd: { type: MarkerType.ArrowClosed, color: '#d1d5db' } },
    { id: 'e2-5', source: '2', target: '5', markerEnd: { type: MarkerType.ArrowClosed, color: '#d1d5db' } },
];

export default function MindMapDetailPage() {
    const params = useParams();
    const categoryId = params.category as string;

    const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);

    const onConnect = useCallback((params: any) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    return (
        <div className="relative w-full h-screen bg-[#fdfbf7] overflow-hidden">
            {/* --- Global Controls UI --- */}
            <div className="absolute top-8 left-8 z-50 flex items-center gap-4">
                <Link
                    href="/library/mindmap"
                    className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 border border-stone-200/60 backdrop-blur-md shadow-sm hover:bg-white transition-all"
                >
                    <ArrowLeft size={16} className="text-stone-400 group-hover:text-stone-800" />
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-stone-500">Exit_Canvas</span>
                </Link>
                <div className="px-5 py-2 rounded-xl bg-white/80 border border-stone-200/60 backdrop-blur-md shadow-sm">
                    <h1 className="text-sm font-serif font-bold text-stone-700 flex items-center gap-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                        {categoryId.toUpperCase()} // ACTIVE_MAP
                    </h1>
                </div>
            </div>

            <div className="absolute top-8 right-8 z-50">
                <button className="p-3 rounded-full bg-stone-800 text-white shadow-xl hover:scale-110 transition-transform flex items-center justify-center">
                    <Share2 size={18} />
                </button>
            </div>

            {/* --- React Flow Canvas --- */}
            <div className="w-full h-full z-10 cursor-crosshair">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    minZoom={0.2}
                    maxZoom={2}
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={32}
                        size={1}
                        color="#4a4a4a"
                        className="opacity-[0.08]"
                    />

                    <Controls className="!bg-white !border-stone-200 !shadow-sm !rounded-lg overflow-hidden" />

                    <Panel position="bottom-right" className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-stone-200 shadow-lg mb-8 mr-8 pointer-events-none select-none">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center gap-10">
                                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Logic_Core</span>
                                <span className="text-[10px] font-mono text-sky-500">v1.2.4r</span>
                            </div>
                            <div className="h-px w-full bg-stone-100" />
                            <div className="space-y-1">
                                <div className="text-[8px] font-mono text-stone-300">SYSTEM_CLOCK: {new Date().toLocaleTimeString()}</div>
                                <div className="text-[8px] font-mono text-stone-300 uppercase tracking-tighter">Render_Mode: SKETCH_CANVAS</div>
                            </div>
                        </div>
                    </Panel>

                    <Panel position="bottom-left" className="mb-8 ml-8">
                        <div className="flex items-center gap-2 px-4 py-2 bg-stone-100/50 backdrop-blur-sm border border-stone-200/40 rounded-full text-[9px] font-mono text-stone-400 font-bold uppercase tracking-widest">
                            <Info size={12} className="text-sky-400" />
                            Use Scroll to Zoom // Click + Drag to Move Nodes
                        </div>
                    </Panel>
                </ReactFlow>
            </div>

            {/* Paper Texture Overlay */}
            <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
                }}
            />
        </div>
    );
}

// Fixed Background import issue
import { BackgroundVariant } from 'reactflow';
