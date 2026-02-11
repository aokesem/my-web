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
    NodeResizer,
    ReactFlowProvider,
    useReactFlow,
    useUpdateNodeInternals
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
    Frame,
    Palette,
    Type,
    Bold,
    Check,
    GitGraph,   // For Tree Layout
    Route       // For Flow Layout
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import rough from 'roughjs';
import dagre from 'dagre';
import { toPng } from 'html-to-image';

// === Styling Constants ===
const STYLE_PRESETS = {
    colors: [
        { id: 'default', label: '默认', bg: 'rgba(255, 255, 255, 0.95)', stroke: '#4a4a4a' },
        { id: 'sky', label: '天蓝', bg: 'rgba(186, 230, 253, 0.6)', stroke: '#0284c7' },
        { id: 'sage', label: '草本', bg: 'rgba(187, 247, 208, 0.6)', stroke: '#16a34a' },
        { id: 'clay', label: '砖红', bg: 'rgba(254, 202, 202, 0.6)', stroke: '#dc2626' },
        { id: 'amber', label: '琥珀', bg: 'rgba(253, 230, 138, 0.6)', stroke: '#d97706' },
    ],
    borderWeights: [
        { id: 'normal', label: '标准', width: 1.2, roughness: 1.5 },
        { id: 'heavy', label: '强调', width: 2.8, roughness: 2.8 },
    ]
};

// === Custom Hand-drawn Node Component ===
const RoughNode = ({ data, selected }: NodeProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Extract styles from data or use defaults
    const activeColor = STYLE_PRESETS.colors.find(c => c.id === data.colorId) || STYLE_PRESETS.colors[0];
    const activeWeight = STYLE_PRESETS.borderWeights.find(w => w.id === data.borderWeightId) || STYLE_PRESETS.borderWeights[0];

    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const rc = rough.canvas(canvas);
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw hand-drawn rectangle with dynamic styling
        rc.rectangle(2, 2, 196, 76, {
            roughness: activeWeight.roughness,
            stroke: activeColor.stroke, // Keep custom color even when selected
            strokeWidth: activeWeight.width,
            fill: activeColor.bg,
            fillStyle: 'hachure',
            fillWeight: 1.5, // Heavier fill weight for visibility
            hachureAngle: 65,
            hachureGap: 6, // Tighter gap for better color visibility
        });

        // Add a secondary "Selection Glow/Outline" if selected
        if (selected) {
            rc.rectangle(0, 0, 200, 80, {
                roughness: 2.5,
                stroke: '#0ea5e9', // Sky-500 for selection indicator
                strokeWidth: 2,
                strokeLineDash: [5, 5],
            });
        }
    }, [selected, data.colorId, data.borderWeightId, activeColor, activeWeight]);

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

                {/* Dynamic Handles based on Layout Direction */}
                {/* Target Handle: Top (Tree) or Left (Flow) */}
                <Handle
                    type="target"
                    position={data.layoutDirection === 'LR' ? Position.Left : Position.Top}
                    className="opacity-0 w-2 h-2"
                    style={data.layoutDirection === 'LR' ? { left: 0 } : { top: 0 }}
                />

                <h3 className={`font-serif text-stone-800 text-sm leading-tight group-hover:text-sky-600 transition-colors ${data.fontWeight === 'bold' ? 'font-black' : 'font-bold'}`}>
                    {data.label}
                </h3>
                <p className="text-[9px] font-mono text-stone-400 mt-1 uppercase tracking-widest opacity-60">
                    {data.type || 'logical_unit'}
                </p>

                {/* Source Handle: Bottom (Tree) or Right (Flow) */}
                <Handle
                    type="source"
                    position={data.layoutDirection === 'LR' ? Position.Right : Position.Bottom}
                    className="opacity-0 w-2 h-2"
                    style={data.layoutDirection === 'LR' ? { right: 0 } : { bottom: 0 }}
                />
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
                style={{ ...style, stroke: '#78716c', strokeWidth: 2, fill: 'none' }}
                className="react-flow__edge-path opacity-60 hover:opacity-100 transition-opacity"
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
    }, [redoStack, nodes, edges, setNodes, setEdges, setHistory]);

    return { nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange, undo, redo, saveToHistory, history, canUndo: history.length > 0, canRedo: redoStack.length > 0 };
};

// === Main Mind Map Component ===
const MindMapBoard = () => {
    const params = useParams();
    const categoryId = params.category as string;
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const { fitView } = useReactFlow();
    const updateNodeInternals = useUpdateNodeInternals();

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
    // Defined BEFORE onLayout so it can be used if needed (though not directly used in onLayout currently)
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

    // Layout Engine
    const getLayoutedElements = useCallback((nds: Node[], eds: Edge[], direction = 'TB') => {
        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));

        const isHorizontal = direction === 'LR';
        dagreGraph.setGraph({ rankdir: direction });

        nds.forEach((node) => {
            // RoughNode standard size is 200x80, RoughGroup is variable but we use style or default
            const width = node.type === 'roughGroup' ? (node.style?.width as number || 400) : 200;
            const height = node.type === 'roughGroup' ? (node.style?.height as number || 240) : 80;
            dagreGraph.setNode(node.id, { width, height });
        });

        eds.forEach((edge) => {
            dagreGraph.setEdge(edge.source, edge.target);
        });

        dagre.layout(dagreGraph);

        return nds.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);
            const width = node.type === 'roughGroup' ? (node.style?.width as number || 400) : 200;
            const height = node.type === 'roughGroup' ? (node.style?.height as number || 240) : 80;

            return {
                ...node,
                position: {
                    x: nodeWithPosition.x - width / 2,
                    y: nodeWithPosition.y - height / 2,
                },
            };
        });
    }, []);

    const onLayout = useCallback((direction: string) => {
        saveToHistory();
        const layoutedNodes = getLayoutedElements(nodes, edges, direction);

        // Update nodes with new positions AND layout direction for handle switching
        const updatedNodes = layoutedNodes.map(node => ({
            ...node,
            data: { ...node.data, layoutDirection: direction }
        }));

        setNodes(updatedNodes);

        // Force update handles for all nodes
        requestAnimationFrame(() => {
            updatedNodes.forEach(node => {
                updateNodeInternals(node.id);
            });

            if (reactFlowInstance) {
                reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
            }
        });
    }, [nodes, edges, getLayoutedElements, setNodes, saveToHistory, reactFlowInstance, updateNodeInternals]);

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

    const updateSelectedNodesStyle = useCallback((styleUpdates: any) => {
        saveToHistory();
        setNodes(nds => nds.map(node =>
            node.selected ? { ...node, data: { ...node.data, ...styleUpdates } } : node
        ));
    }, [setNodes, saveToHistory]);

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

    // === Export Logic ===
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    const downloadImage = useCallback(() => {
        if (reactFlowWrapper.current === null) {
            return;
        }

        toPng(reactFlowWrapper.current, {
            cacheBust: true,
            backgroundColor: '#fdfbf7',
            filter: (node) => {
                // Filter out any element with the 'no-export' class
                if (node.classList?.contains('no-export')) return false;
                // Filter out React Flow controls/panels/attribution
                if (node.classList?.contains('react-flow__controls') ||
                    node.classList?.contains('react-flow__panel') ||
                    node.classList?.contains('react-flow__attribution')) return false;
                return true;
            }
        })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `mindmap-${categoryId}-${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => {
                console.error('oops, something went wrong!', err);
            })
            .finally(() => {
                setIsExportMenuOpen(false);
            });
    }, [reactFlowWrapper, categoryId]);

    const exportToMarkdown = useCallback(() => {
        // Recursive function to build markdown tree
        const buildMarkdown = (nodeId: string, depth: number = 0): string => {
            const node = nodes.find(n => n.id === nodeId);
            if (!node) return '';

            const indent = '  '.repeat(depth);
            let md = `${indent}- ${node.data.label}\n`;

            // Find children: edges where source is this node
            const childrenIds = edges
                .filter(e => e.source === nodeId)
                .map(e => e.target);

            // Sort children by Y position for logical reading order
            const childrenNodes = nodes.filter(n => childrenIds.includes(n.id))
                .sort((a, b) => a.position.y - b.position.y);

            childrenNodes.forEach(child => {
                md += buildMarkdown(child.id, depth + 1);
            });

            return md;
        };

        // Find root nodes (no incoming edges)
        const rootNodes = nodes.filter(n => !edges.some(e => e.target === n.id));
        let fullMarkdown = `# Mind Map: ${categoryId}\n\n`;

        rootNodes.sort((a, b) => a.position.y - b.position.y).forEach(root => {
            fullMarkdown += buildMarkdown(root.id);
        });

        const blob = new Blob([fullMarkdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `mindmap-${categoryId}-${Date.now()}.md`;
        link.href = url;
        link.click();
        setIsExportMenuOpen(false);
    }, [nodes, edges, categoryId]);

    const exportToJSON = useCallback(() => {
        const data = JSON.stringify({ nodes, edges }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `mindmap-${categoryId}-${Date.now()}.json`;
        link.href = url;
        link.click();
        setIsExportMenuOpen(false);
    }, [nodes, edges, categoryId]);

    return (
        <div className="relative w-full h-screen bg-[#fdfbf7] overflow-hidden" ref={reactFlowWrapper}>
            {/* --- Global Controls UI --- */}
            <div className="absolute top-8 left-8 z-50 flex items-center gap-4 no-export">
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
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-2 py-2 bg-stone-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl no-export">
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

            {/* --- Style Toolbar (Conditional) --- */}
            <AnimatePresence mode="wait">
                {selectedIds.length > 0 && !nodes.find(n => n.id === selectedIds[0] && n.type === 'roughGroup') && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="absolute top-20 left-1/2 z-50 flex items-center gap-2 px-3 py-1.5 bg-stone-900/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl no-export"
                    >
                        <div className="flex items-center gap-0.5 pr-2 border-r border-white/10">
                            <Palette size={12} strokeWidth={1.5} className="text-stone-500 mr-1" />
                            {STYLE_PRESETS.colors.map(color => (
                                <button
                                    key={color.id}
                                    onClick={() => updateSelectedNodesStyle({ colorId: color.id })}
                                    className="w-4 h-4 rounded-full border border-white/10 transition-transform hover:scale-125"
                                    style={{ backgroundColor: color.stroke }}
                                    title={color.label}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-1 px-1 border-r border-white/10">
                            {STYLE_PRESETS.borderWeights.map(weight => (
                                <button
                                    key={weight.id}
                                    onClick={() => updateSelectedNodesStyle({ borderWeightId: weight.id })}
                                    className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/5 transition-all"
                                    title={`边框: ${weight.label}`}
                                >
                                    <Type size={14} strokeWidth={weight.id === 'heavy' ? 3 : 1.5} />
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                const isBold = nodes.find(n => n.id === selectedIds[0])?.data?.fontWeight === 'bold';
                                updateSelectedNodesStyle({ fontWeight: isBold ? 'normal' : 'bold' });
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/5 transition-all"
                            title="加粗文字"
                        >
                            <Bold size={14} strokeWidth={2.5} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute top-8 right-8 z-50 flex items-center gap-4 no-export">
                {/* Layout Switches (Top Right) */}
                <div className="flex bg-white/80 backdrop-blur-md rounded-2xl p-1 border border-stone-200/60 shadow-sm">
                    <button
                        onClick={() => onLayout('TB')}
                        className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all"
                        title="Tree Layout (Top-Down)"
                    >
                        <GitGraph size={18} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={() => onLayout('LR')}
                        className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-all"
                        title="Flow Layout (Left-Right)"
                    >
                        <Route size={18} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                        className="p-3 rounded-full bg-stone-800 text-white shadow-xl hover:scale-110 transition-transform flex items-center justify-center relative z-20"
                    >
                        <Share2 size={18} />
                    </button>

                    <AnimatePresence>
                        {isExportMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10, x: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10, x: -10 }}
                                className="absolute top-full right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-2xl shadow-xl overflow-hidden z-10 origin-top-right flex flex-col py-1"
                            >
                                <button
                                    onClick={downloadImage}
                                    className="px-4 py-2.5 text-left text-xs font-serif font-bold text-stone-600 hover:bg-stone-50 hover:text-stone-900 flex items-center gap-2 transition-colors uppercase tracking-wider"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                    Download Image
                                </button>
                                <button
                                    onClick={exportToMarkdown}
                                    className="px-4 py-2.5 text-left text-xs font-serif font-bold text-stone-600 hover:bg-stone-50 hover:text-stone-900 flex items-center gap-2 transition-colors uppercase tracking-wider"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Copy Markdown
                                </button>
                                <button
                                    onClick={exportToJSON}
                                    className="px-4 py-2.5 text-left text-xs font-serif font-bold text-stone-600 hover:bg-stone-50 hover:text-stone-900 flex items-center gap-2 transition-colors uppercase tracking-wider"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Backup JSON
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
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
};

export default function MindMapPage() {
    return (
        <ReactFlowProvider>
            <MindMapBoard />
        </ReactFlowProvider>
    );
}
