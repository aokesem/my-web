"use client";

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
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
    MarkerType,
    BackgroundVariant,
    Connection,
    Edge,
    Node,
    XYPosition,
    NodeResizer
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Share2,
    MousePointer2,
    Scan,
    Info,
    RotateCcw,
    RotateCw,
    Plus,
    Trash2,
    Layout as LayoutIcon,
    FileText,
    Hand,
    BoxSelect,
    ArrowRightCircle,
    Square,
    StickyNote,
    Frame
} from 'lucide-react';
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
                <Handle type="target" position={Position.Top} className="opacity-0 w-20 h-2" style={{ top: 0 }} />
                <h3 className="font-serif font-bold text-stone-800 text-sm leading-tight group-hover:text-sky-600 transition-colors">
                    {data.label}
                </h3>
                <p className="text-[9px] font-mono text-stone-400 mt-1 uppercase tracking-widest opacity-60">
                    {data.type || 'logical_unit'}
                </p>
                <Handle type="source" position={Position.Bottom} className="opacity-0 w-20 h-2" style={{ bottom: 0 }} />
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
                style={style}
                className="react-flow__edge-path fill-none stroke-stone-300 stroke-[1.5px] opacity-40 hover:opacity-100 transition-opacity"
                d={edgePath}
                markerEnd={markerEnd}
            />
        </>
    );
};

// === Custom Group Frame Component ===
const RoughGroup = ({ data, selected, id }: NodeProps) => {
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

const nodeTypes = {
    rough: RoughNode,
    roughGroup: RoughGroup,
};

const edgeTypes = {
    rough: RoughEdge,
};

// === Initial Mock Data ===
const INITIAL_NODES: Node[] = [
    { id: '1', type: 'rough', position: { x: 400, y: 100 }, data: { id: '01', label: '核心目标: 出行指南', type: 'CORE_ANCHOR' } },
    { id: '2', type: 'rough', position: { x: 150, y: 300 }, data: { id: '02', label: '交通选型: 轨道交通', type: 'LOGISTICS' } },
    { id: '3', type: 'rough', position: { x: 650, y: 300 }, data: { id: '03', label: '住宿定位: 艺术酒店', type: 'LODGING' } },
    { id: '4', type: 'rough', position: { x: 50, y: 500 }, data: { id: '04', label: '路线 A: 沿海步道', type: 'PATH_VAL_01' } },
    { id: '5', type: 'rough', position: { x: 250, y: 500 }, data: { id: '05', label: '路线 B: 城市中心', type: 'PATH_VAL_02' } },
];

const INITIAL_EDGES: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#d1d5db' } },
    { id: 'e1-3', source: '1', target: '3', markerEnd: { type: MarkerType.ArrowClosed, color: '#d1d5db' } },
    { id: 'e2-4', source: '2', target: '4', markerEnd: { type: MarkerType.ArrowClosed, color: '#d1d5db' } },
    { id: 'e2-5', source: '2', target: '5', markerEnd: { type: MarkerType.ArrowClosed, color: '#d1d5db' } },
];

// === History Hook ===
const useHistory = (initialNodes: Node[], initialEdges: Edge[]) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
    const [redoStack, setRedoStack] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);

    const saveToHistory = useCallback(() => {
        setHistory(prev => [...prev.slice(-49), { nodes, edges }]);
        setRedoStack([]);
    }, [nodes, edges]);

    const undo = useCallback(() => {
        if (history.length === 0) return;
        const prevState = history[history.length - 1];
        setRedoStack(prev => [...prev, { nodes, edges }]);
        setNodes(prevState.nodes);
        setEdges(prevState.edges);
        setHistory(prev => prev.slice(0, -1));
    }, [history, nodes, edges, setNodes, setEdges]);

    const redo = useCallback(() => {
        if (redoStack.length === 0) return;
        const nextState = redoStack[redoStack.length - 1];
        setHistory(prev => [...prev, { nodes, edges }]);
        setNodes(nextState.nodes);
        setEdges(nextState.edges);
        setRedoStack(prev => prev.slice(0, -1));
    }, [redoStack, nodes, edges, setNodes, setEdges]);

    return { nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange, undo, redo, saveToHistory, history, canUndo: history.length > 0, canRedo: redoStack.length > 0 };
};

export default function MindMapDetailPage() {
    const params = useParams();
    const categoryId = params.category as string;
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

    // Tool States
    const [interactionMode, setInteractionMode] = useState<'pan' | 'select'>('pan');

    const {
        nodes, setNodes, onNodesChange,
        edges, setEdges, onEdgesChange,
        undo, redo, saveToHistory,
        history,
        canUndo, canRedo
    } = useHistory(INITIAL_NODES, INITIAL_EDGES);

    // Track selection order for intelligent connectivity
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
        const ids = nodes.map(n => n.id);
        setSelectedIds(prev => {
            // Keep nodes that are still selected, append new ones at the end
            const stillSelected = prev.filter(id => ids.includes(id));
            const newlySelected = ids.filter(id => !prev.includes(id));
            return [...stillSelected, ...newlySelected];
        });
    }, []);

    const onConnect = useCallback((params: Connection) => {
        saveToHistory();
        setEdges((eds) => addEdge(params, eds));
    }, [setEdges, saveToHistory]);

    // Create Free Node (Sticky Note)
    const createFreeNode = useCallback(() => {
        saveToHistory();
        const id = `node-${Date.now()}`;
        const position = reactFlowInstance ? reactFlowInstance.screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        }) : { x: 400, y: 300 };

        const newNode: Node = {
            id,
            type: 'rough',
            position,
            data: { id: id.slice(-4), label: '灵感片段...', type: 'IDEA' },
        };
        setNodes(nds => nds.concat(newNode));
    }, [reactFlowInstance, setNodes, saveToHistory]);

    // Create Group Frame
    const createGroupFrame = useCallback(() => {
        saveToHistory();
        const id = `group-${Date.now()}`;
        const position = reactFlowInstance ? reactFlowInstance.screenToFlowPosition({
            x: window.innerWidth / 2 - 200,
            y: window.innerHeight / 2 - 120
        }) : { x: 200, y: 150 };

        const newGroup: Node = {
            id,
            type: 'roughGroup',
            position,
            data: { label: 'GROUP_BLOCK' },
            style: { width: 400, height: 240 },
            zIndex: -1,
        };
        setNodes(nds => nds.concat(newGroup));
    }, [reactFlowInstance, setNodes, saveToHistory]);

    // Create Child Node (Intelligent)
    const createChildNode = useCallback(() => {
        const selectedNode = nodes.find(n => n.selected && n.type === 'rough');
        if (!selectedNode) return;

        saveToHistory();
        const id = `node-${Date.now()}`;
        const newNode: Node = {
            id,
            type: 'rough',
            position: { x: selectedNode.position.x, y: selectedNode.position.y + 150 },
            data: { id: id.slice(-4), label: '新子节点', type: 'BRANCH' },
        };
        const newEdge: Edge = {
            id: `e-${selectedNode.id}-${id}`,
            source: selectedNode.id,
            target: id,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#d1d5db' }
        };

        setNodes(nds => nds.concat(newNode));
        setEdges(eds => eds.concat(newEdge));
    }, [nodes, setNodes, setEdges, saveToHistory]);

    // Manual Connect (Link nodes based on selection order)
    const connectSelectedNodes = useCallback(() => {
        if (selectedIds.length < 2) return;

        saveToHistory();
        // Use the first two selected nodes in the recorded order
        const sourceId = selectedIds[0];
        const targetId = selectedIds[1];

        const newEdge: Edge = {
            id: `e-${sourceId}-${targetId}-${Date.now()}`,
            source: sourceId,
            target: targetId,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#d1d5db' }
        };
        setEdges(eds => addEdge(newEdge, eds));
    }, [selectedIds, setEdges, saveToHistory]);

    const deleteSelected = useCallback(() => {
        if (nodes.some(n => n.selected) || edges.some(e => e.selected)) {
            saveToHistory();
            setNodes(nds => nds.filter(n => !n.selected));
            setEdges(eds => eds.filter(e => !e.selected));
        }
    }, [nodes, edges, setNodes, setEdges, saveToHistory]);

    // Keyboard Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                createChildNode();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
            if (e.key === 'Backspace' || e.key === 'Delete') {
                deleteSelected();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo, createChildNode, deleteSelected]);

    return (
        <div className="relative w-full h-screen bg-[#fdfbf7] overflow-hidden" ref={reactFlowWrapper}>
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

            {/* --- Advanced Toolbar --- */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-2 py-2 bg-stone-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                {/* Mode Switchers */}
                <div className="flex bg-stone-900/50 rounded-xl p-0.5 border border-white/5">
                    <button
                        onClick={() => setInteractionMode('pan')}
                        className={`p-2 rounded-lg transition-all ${interactionMode === 'pan' ? 'bg-white/10 text-white shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}
                        title="Pan Mode (Hand)"
                    >
                        <Hand size={16} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={() => setInteractionMode('select')}
                        className={`p-2 rounded-lg transition-all ${interactionMode === 'select' ? 'bg-white/10 text-white shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}
                        title="Select Mode (Box)"
                    >
                        <BoxSelect size={16} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="w-px h-5 bg-white/10 mx-1" />

                {/* Object Creation */}
                <button
                    onClick={createFreeNode}
                    className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    title="Create Free Node (Sticky Note)"
                >
                    <StickyNote size={16} strokeWidth={1.5} />
                </button>
                <button
                    onClick={createChildNode}
                    className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    title="Add Child Node (Tab)"
                >
                    <Plus size={16} strokeWidth={1.5} />
                </button>
                <button
                    onClick={createGroupFrame}
                    className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    title="Create Grouping Frame"
                >
                    <Frame size={16} strokeWidth={1.5} />
                </button>
                <button
                    onClick={connectSelectedNodes}
                    className="p-2 text-stone-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    title="Connect Selected Nodes"
                >
                    <ArrowRightCircle size={16} strokeWidth={1.5} />
                </button>

                <div className="w-px h-5 bg-white/10 mx-1" />

                {/* History & Delete */}
                <button
                    onClick={undo}
                    disabled={!canUndo}
                    className={`p-2 rounded-xl transition-all ${canUndo ? 'text-stone-300 hover:bg-white/10 hover:text-white' : 'text-stone-600 cursor-not-allowed'}`}
                    title="Undo (Ctrl+Z)"
                >
                    <RotateCcw size={16} strokeWidth={1.5} />
                </button>
                <button
                    onClick={redo}
                    disabled={!canRedo}
                    className={`p-2 rounded-xl transition-all ${canRedo ? 'text-stone-300 hover:bg-white/10 hover:text-white' : 'text-stone-600 cursor-not-allowed'}`}
                    title="Redo (Ctrl+Y)"
                >
                    <RotateCw size={16} strokeWidth={1.5} />
                </button>
                <button
                    onClick={deleteSelected}
                    className="p-2 text-red-300/80 hover:text-red-200 hover:bg-red-400/20 rounded-xl transition-all"
                    title="Delete Selected (Backspace)"
                >
                    <Trash2 size={16} strokeWidth={1.5} />
                </button>
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
                    onInit={setReactFlowInstance}
                    onSelectionChange={onSelectionChange}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    minZoom={0.2}
                    maxZoom={2}
                    deleteKeyCode={null}
                    selectionOnDrag={interactionMode === 'select'}
                    panOnDrag={interactionMode === 'pan'}
                    selectionMode={interactionMode === 'select' ? /** SelectionMode.Full */ undefined : undefined}
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={32}
                        size={1}
                        color="#4a4a4a"
                        className="opacity-[0.08]"
                    />

                    <Controls className="bg-white! border-stone-200! shadow-sm! rounded-lg! overflow-hidden" />

                    <Panel position="bottom-right" className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-stone-200 shadow-lg mb-8 mr-8 pointer-events-none select-none">
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center gap-10">
                                <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">Logic_Core</span>
                                <span className="text-[10px] font-mono text-sky-500">v1.3.1_tools</span>
                            </div>
                            <div className="h-px w-full bg-stone-100" />
                            <div className="space-y-1">
                                <div className="text-[8px] font-mono text-stone-300">HISTORY_DEPTH: {history.length}</div>
                                <div className="text-[8px] font-mono text-stone-300 uppercase tracking-tighter">TOOL: {interactionMode.toUpperCase()}</div>
                            </div>
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
