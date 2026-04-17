"use client";

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import ReactFlow, {
    Background, Controls, ControlButton, Panel, addEdge, MarkerType, BackgroundVariant,
    Connection, Edge, Node, useReactFlow, useUpdateNodeInternals
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Share2, Hand, BoxSelect, ArrowRightCircle,
    StickyNote, Frame, Palette, Type, Bold,
    GitGraph, Route, Plus, Trash2, RotateCcw, RotateCw, Save, Loader2, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dagre from 'dagre';
import { toPng, toCanvas } from 'html-to-image';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabaseClient';
import { STYLE_PRESETS } from '../constants';
import { calculateNodeSize } from '../utils';
import { useHistory } from '../hooks/useHistory';
import { ModernNode } from './ModernNode';
import { ModernGroup } from './ModernGroup';
import { ModernEdge } from './ModernEdge';

const nodeTypes = {
    modern: ModernNode,
    modernGroup: ModernGroup,
    // Alias old types to new components for backward compatibility
    rough: ModernNode,
    roughGroup: ModernGroup,
};

const edgeTypes = {
    modern: ModernEdge,
    rough: ModernEdge,
};

export const MindMapBoard = () => {
    const params = useParams();
    const categoryId = params.category as string;
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const { fitView } = useReactFlow();
    const updateNodeInternals = useUpdateNodeInternals();
    const [isSaving, setIsSaving] = useState(false);

    // Tool States
    const [interactionMode, setInteractionMode] = useState<'pan' | 'select'>('pan');
    const [autoLayoutMode, setAutoLayoutMode] = useState(false);
    const [autoLayoutDirection, setAutoLayoutDirection] = useState<'LR' | 'TB'>('LR');
    const prevNodeCountRef = useRef(0);
    const prevEdgeCountRef = useRef(0);

    // Initial Data Fetch
    const [initialDataLoaded, setInitialDataLoaded] = useState(false);

    // We need to lift nodes/edges state up or use a ref to initialize? 
    // Actually useHistory initializes state. We might need to override it after fetch.
    const {
        nodes, setNodes, onNodesChange,
        edges, setEdges, onEdgesChange,
        undo, redo, saveToHistory,
        history,
        canUndo, canRedo
    } = useHistory([], []); // Start empty

    const lastSavedDataRef = useRef<{ nodes: Node[], edges: Edge[] }>({ nodes: [], edges: [] });
    const currentDataRef = useRef<{ nodes: Node[], edges: Edge[] }>({ nodes: [], edges: [] });
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Keep currentDataRef in sync for unmount accessibility
    useEffect(() => {
        currentDataRef.current = { nodes, edges };
    }, [nodes, edges]);

    // Initial load sync
    useEffect(() => {
        if (initialDataLoaded) {
            lastSavedDataRef.current = { nodes, edges };
            currentDataRef.current = { nodes, edges };
            setHasUnsavedChanges(false);
        }
    }, [initialDataLoaded]);

    // Check for changes
    useEffect(() => {
        if (!initialDataLoaded) return;

        const isDirty = JSON.stringify(lastSavedDataRef.current.nodes) !== JSON.stringify(nodes) ||
            JSON.stringify(lastSavedDataRef.current.edges) !== JSON.stringify(edges);
        setHasUnsavedChanges(isDirty);
    }, [nodes, edges, initialDataLoaded]);

    // Exit protection
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Auto-save attempt on component unmount
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);

            // Check changes using refs to avoid closure stale issues
            const isDirty = JSON.stringify(lastSavedDataRef.current.nodes) !== JSON.stringify(currentDataRef.current.nodes) ||
                JSON.stringify(lastSavedDataRef.current.edges) !== JSON.stringify(currentDataRef.current.edges);

            if (isDirty) {
                // Fire and forget update on unmount
                supabase
                    .from('mind_maps')
                    .update({
                        nodes_data: currentDataRef.current,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', categoryId)
                    .then(({ error }) => {
                        if (error) console.error("Unmount auto-save failed:", error);
                        else console.log("Unmount auto-save successful");
                    });
            }
        };
    }, [hasUnsavedChanges, categoryId]);

    useEffect(() => {
        const loadMap = async () => {
            const { data, error } = await supabase
                .from('mind_maps')
                .select('nodes_data')
                .eq('id', categoryId)
                .single();

            if (data && data.nodes_data) {
                // Determine if we have valid data
                const loadedNodes = data.nodes_data.nodes || [];
                const loadedEdges = data.nodes_data.edges || [];

                if (loadedNodes.length > 0) {
                    setNodes(loadedNodes);
                    setEdges(loadedEdges);
                    prevNodeCountRef.current = loadedNodes.length;
                    prevEdgeCountRef.current = loadedEdges.length;
                } else {
                    // Fallback to initial mock if empty (optional, for demo)
                    // setNodes(INITIAL_NODES); 
                    // setEdges(INITIAL_EDGES);
                }
            }
            setInitialDataLoaded(true);
        };
        loadMap();
    }, [categoryId, setNodes, setEdges]);

    const captureThumbnail = useCallback(async (): Promise<string | null> => {
        if (!reactFlowWrapper.current) return null;
        try {
            const canvas = await toCanvas(reactFlowWrapper.current, {
                cacheBust: true,
                backgroundColor: '#fdfbf7',
                pixelRatio: 0.5,
                filter: (node) => {
                    if (node.classList?.contains('no-export')) return false;
                    if (node.classList?.contains('react-flow__controls') ||
                        node.classList?.contains('react-flow__panel') ||
                        node.classList?.contains('react-flow__attribution') ||
                        node.classList?.contains('react-flow__minimap')) return false;
                    return true;
                }
            });
            return canvas.toDataURL('image/webp', 0.7);
        } catch (err) {
            console.error('Thumbnail capture failed:', err);
            return null;
        }
    }, [reactFlowWrapper]);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            const flowData = { nodes, edges };
            // Capture thumbnail in parallel
            const thumbnail = await captureThumbnail();

            const updatePayload: any = {
                nodes_data: flowData,
                updated_at: new Date().toISOString()
            };
            if (thumbnail) {
                updatePayload.thumbnail = thumbnail;
            }

            const { error } = await supabase
                .from('mind_maps')
                .update(updatePayload)
                .eq('id', categoryId);

            if (error) throw error;
            lastSavedDataRef.current = { nodes, edges };
            setHasUnsavedChanges(false);
            toast.success("Design saved to cloud.");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save.");
        } finally {
            setIsSaving(false);
        }
    }, [nodes, edges, categoryId, captureThumbnail]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

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
        dagreGraph.setGraph({ rankdir: direction, nodesep: 40, ranksep: 100 });

        nds.forEach((node) => {
            const isGroup = node.type === 'modernGroup' || node.type === 'roughGroup';
            const { width, height } = isGroup
                ? { width: (node.style?.width as number || 400), height: (node.style?.height as number || 240) }
                : calculateNodeSize(node.data.label || '');
            
            dagreGraph.setNode(node.id, { width, height });
        });

        eds.forEach((edge) => {
            dagreGraph.setEdge(edge.source, edge.target);
        });

        dagre.layout(dagreGraph);

        return nds.map((node) => {
            const nodeWithPosition = dagreGraph.node(node.id);
            const isGroup = node.type === 'modernGroup' || node.type === 'roughGroup';
            const { width, height } = isGroup
                ? { width: (node.style?.width as number || 400), height: (node.style?.height as number || 240) }
                : calculateNodeSize(node.data.label || '');

            return {
                ...node,
                position: {
                    x: nodeWithPosition.x - width / 2,
                    y: nodeWithPosition.y - height / 2,
                },
            };
        });
    }, []);

    const onLayout = useCallback((direction: string, options?: { skipFitView?: boolean, skipHistory?: boolean }) => {
        if (!options?.skipHistory) saveToHistory();
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
        });
    }, [nodes, edges, getLayoutedElements, setNodes, saveToHistory, updateNodeInternals]);

    // Auto-layout: re-run layout when nodes/edges are added while mode is active
    useEffect(() => {
        if (!autoLayoutMode || !initialDataLoaded) return;
        const nodeCount = nodes.length;
        const edgeCount = edges.length;

        if (nodeCount !== prevNodeCountRef.current || edgeCount !== prevEdgeCountRef.current) {
            // Only auto-layout when items are added, not removed (to avoid layout on delete)
            if (nodeCount > prevNodeCountRef.current || edgeCount > prevEdgeCountRef.current) {
                onLayout(autoLayoutDirection, { skipFitView: true, skipHistory: true });
            }
            prevNodeCountRef.current = nodeCount;
            prevEdgeCountRef.current = edgeCount;
        }
    }, [nodes.length, edges.length, autoLayoutMode, autoLayoutDirection, initialDataLoaded, onLayout]);

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
            type: 'modern',
            position,
            data: { label: '灵感片段...', colorId: 'white', isNew: true },
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
            type: 'modernGroup',
            position,
            data: { label: '未命名分组' },
            style: { width: 400, height: 240 },
            zIndex: -1,
        };
        setNodes(nds => nds.concat(newGroup));
    }, [reactFlowInstance, setNodes, saveToHistory]);

    // Create Child Node (Intelligent)
    const createChildNode = useCallback(() => {
        const selectedNode = nodes.find(n => n.selected && (n.type === 'modern' || n.type === 'rough'));
        if (!selectedNode) return;

        saveToHistory();
        const id = `node-${Date.now()}`;
        const newNode: Node = {
            id,
            type: 'modern',
            position: { x: selectedNode.position.x, y: selectedNode.position.y + 150 },
            data: { label: '新子节点', colorId: selectedNode.data?.colorId || 'white', isNew: true },
        };
        const newEdge: Edge = {
            id: `e-${selectedNode.id}-${id}`,
            source: selectedNode.id,
            target: id,
            type: 'modern',
            style: { stroke: '#94a3b8', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.Arrow, color: '#94a3b8' }
        };

        setNodes(nds => nds.concat(newNode));
        setEdges(eds => eds.concat(newEdge));
    }, [nodes, setNodes, setEdges, saveToHistory]);

    // Create Sibling Node
    const createSiblingNode = useCallback(() => {
        const selectedNode = nodes.find(n => n.selected && (n.type === 'modern' || n.type === 'rough'));
        if (!selectedNode) return;

        saveToHistory();
        const id = `node-${Date.now()}`;

        // Find parent
        const parentEdge = edges.find(e => e.target === selectedNode.id);
        const parentId = parentEdge?.source;

        const newNode: Node = {
            id,
            type: 'modern',
            // Position slightly below the selected node
            position: { x: selectedNode.position.x, y: selectedNode.position.y + 100 },
            data: { label: '新兄弟节点', colorId: selectedNode.data?.colorId || 'white', isNew: true },
        };

        if (parentId) {
            const newEdge: Edge = {
                id: `e-${parentId}-${id}`,
                source: parentId,
                target: id,
                type: 'modern',
                style: { stroke: '#94a3b8', strokeWidth: 1.5 },
                markerEnd: { type: MarkerType.Arrow, color: '#94a3b8' }
            };
            setEdges(eds => eds.concat(newEdge));
        }

        setNodes(nds => nds.concat(newNode));
    }, [nodes, edges, setNodes, setEdges, saveToHistory]);

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
            type: 'modern',
            style: { stroke: '#94a3b8', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.Arrow, color: '#94a3b8' }
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
            if (e.key === 'Enter') {
                e.preventDefault();
                createSiblingNode();
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
            if (e.key === ' ') {
                e.preventDefault();
                setInteractionMode(prev => prev === 'pan' ? 'select' : 'pan');
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
                    onClick={(e) => {
                        if (hasUnsavedChanges) {
                            // Non-blocking hint: we will try to auto-save on unmount, 
                            // but we can give a quick toast or log.
                            console.log("Navigating away with unsaved changes. Auto-save triggered.");
                        }
                    }}
                    className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 border border-stone-200/60 backdrop-blur-md shadow-sm hover:bg-white transition-all"
                >
                    <ArrowLeft size={16} className="text-stone-400 group-hover:text-stone-800" />
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-stone-500">Exit_Canvas</span>
                </Link>
                <div className="px-5 py-2 rounded-xl bg-white/80 border border-stone-200/60 backdrop-blur-md shadow-sm flex items-center gap-3">
                    <h1 className="text-sm font-serif font-bold text-stone-700 flex items-center gap-3">
                        <span className={`w-1.5 h-1.5 rounded-full ${hasUnsavedChanges ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                        {categoryId.toUpperCase()} // ACTIVE_MAP
                    </h1>
                    {hasUnsavedChanges && (
                        <span className="text-[10px] font-mono text-amber-600 font-bold uppercase tracking-widest animate-in fade-in slide-in-from-left-2">Unsaved_Changes</span>
                    )}
                </div>
            </div>

            {/* --- Sidebar UI Controls --- */}
            <div className="absolute left-8 top-1/2 -translate-y-1/2 z-50 flex flex-row items-center gap-4 no-export">
                {/* Advanced Toolbar */}
                <div className="flex flex-col items-center gap-2 p-2 bg-stone-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                    {/* Mode Switchers */}
                    <div className="flex flex-col bg-stone-900/50 rounded-xl p-0.5 border border-white/5">
                        <button
                            onClick={() => setInteractionMode('pan')}
                            className={`p-2.5 rounded-lg transition-all ${interactionMode === 'pan' ? 'bg-white/10 text-white shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}
                            title="Pan Mode (Hand)"
                        >
                            <Hand size={18} strokeWidth={1.5} />
                        </button>
                        <button
                            onClick={() => setInteractionMode('select')}
                            className={`p-2.5 rounded-lg transition-all ${interactionMode === 'select' ? 'bg-white/10 text-white shadow-sm' : 'text-stone-500 hover:text-stone-300'}`}
                            title="Select Mode (Box)"
                        >
                            <BoxSelect size={18} strokeWidth={1.5} />
                        </button>
                    </div>

                    <div className="w-8 h-px bg-white/10 my-1" />

                    {/* Object Creation */}
                    <button
                        onClick={createFreeNode}
                        className="p-2.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        title="Create Free Node"
                    >
                        <StickyNote size={18} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={createChildNode}
                        className="p-2.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        title="Add Child Node (Tab)"
                    >
                        <Plus size={18} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={createGroupFrame}
                        className="p-2.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        title="Create Grouping Frame"
                    >
                        <Frame size={18} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={connectSelectedNodes}
                        className="p-2.5 text-stone-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        title="Connect Selected Nodes"
                    >
                        <ArrowRightCircle size={18} strokeWidth={1.5} />
                    </button>

                    <div className="w-8 h-px bg-white/10 my-1" />

                    {/* History & Delete */}
                    <button
                        onClick={undo}
                        disabled={!canUndo}
                        className={`p-2.5 rounded-xl transition-all ${canUndo ? 'text-stone-400 hover:bg-white/10 hover:text-white' : 'text-stone-700 cursor-not-allowed'}`}
                        title="Undo (Ctrl+Z)"
                    >
                        <RotateCcw size={18} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={redo}
                        disabled={!canRedo}
                        className={`p-2.5 rounded-xl transition-all ${canRedo ? 'text-stone-400 hover:bg-white/10 hover:text-white' : 'text-stone-700 cursor-not-allowed'}`}
                        title="Redo (Ctrl+Y)"
                    >
                        <RotateCw size={18} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={deleteSelected}
                        className="p-2.5 text-red-400/80 hover:text-red-300 hover:bg-red-400/20 rounded-xl transition-all"
                        title="Delete Selected (Backspace)"
                    >
                        <Trash2 size={18} strokeWidth={1.5} />
                    </button>
                </div>

                {/* --- Style Toolbar (Conditional) --- */}
                <AnimatePresence mode="wait">
                    {selectedIds.length > 0 && !nodes.find(n => n.id === selectedIds[0] && n.type === 'roughGroup') && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col items-center gap-3 p-2 bg-stone-900/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl"
                        >
                            <div className="flex flex-col items-center gap-1.5 pb-2 border-b border-white/10">
                                {STYLE_PRESETS.colors.map(color => (
                                    <button
                                        key={color.id}
                                        onClick={() => updateSelectedNodesStyle({ colorId: color.id })}
                                        className={`w-5 h-5 rounded-full border border-white/10 transition-transform hover:scale-125 ${color.bg === 'bg-white' ? 'bg-white' : color.bg}`}
                                        title={color.label}
                                    />
                                ))}
                            </div>

                            <div className="flex flex-col gap-1 py-1 border-b border-white/10">
                                {STYLE_PRESETS.borderWeights.map(weight => (
                                    <button
                                        key={weight.id}
                                        onClick={() => updateSelectedNodesStyle({ borderWeightId: weight.id })}
                                        className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 transition-all"
                                        title={`边框: ${weight.label}`}
                                    >
                                        <Type size={16} strokeWidth={weight.id === 'heavy' ? 3 : 1.5} />
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => {
                                    const isBold = nodes.find(n => n.id === selectedIds[0])?.data?.fontWeight === 'bold';
                                    updateSelectedNodesStyle({ fontWeight: isBold ? 'normal' : 'bold' });
                                }}
                                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 transition-all"
                                title="加粗文字"
                            >
                                <Bold size={16} strokeWidth={2.5} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="absolute top-8 right-8 z-50 flex items-center gap-6 no-export">
                {/* Layout Mode Toggles (Top Right) */}
                <div className="flex bg-white/80 backdrop-blur-md rounded-2xl p-1 border border-stone-200/60 shadow-sm items-center gap-1">
                    <button
                        onClick={() => {
                            if (autoLayoutMode && autoLayoutDirection === 'TB') {
                                setAutoLayoutMode(false);
                            } else {
                                setAutoLayoutDirection('TB');
                                setAutoLayoutMode(true);
                                onLayout('TB');
                            }
                        }}
                        className={`p-2 rounded-xl transition-all ${autoLayoutMode && autoLayoutDirection === 'TB' ? 'bg-sky-100 text-sky-600 shadow-sm' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'}`}
                        title={autoLayoutMode && autoLayoutDirection === 'TB' ? 'Auto-Layout ON (Top-Down) — Click to disable' : 'Enable Auto-Layout (Top-Down)'}
                    >
                        <GitGraph size={18} strokeWidth={1.5} />
                    </button>
                    <button
                        onClick={() => {
                            if (autoLayoutMode && autoLayoutDirection === 'LR') {
                                setAutoLayoutMode(false);
                            } else {
                                setAutoLayoutDirection('LR');
                                setAutoLayoutMode(true);
                                onLayout('LR');
                            }
                        }}
                        className={`p-2 rounded-xl transition-all ${autoLayoutMode && autoLayoutDirection === 'LR' ? 'bg-sky-100 text-sky-600 shadow-sm' : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'}`}
                        title={autoLayoutMode && autoLayoutDirection === 'LR' ? 'Auto-Layout ON (Left-Right) — Click to disable' : 'Enable Auto-Layout (Left-Right)'}
                    >
                        <Route size={18} strokeWidth={1.5} />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="p-3 rounded-full bg-sky-600 text-white shadow-xl hover:scale-110 hover:bg-sky-500 transition-all flex items-center justify-center relative z-20 group"
                        title="Save to Cloud (Ctrl+S)"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        <span className="absolute top-full mt-2 right-0 bg-stone-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Save (Ctrl+S)
                        </span>
                    </button>

                    <div className="w-px h-6 bg-stone-300/50" />

                    <button
                        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                        className="p-3 rounded-full bg-stone-800 text-white shadow-xl hover:scale-110 transition-transform flex items-center justify-center relative z-20"
                    >
                        <Share2 size={18} />
                    </button>
                </div>

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
                    nodesDraggable={!autoLayoutMode}
                    selectionOnDrag={interactionMode === 'select'}
                    panOnDrag={interactionMode === 'pan'}
                    selectionMode={interactionMode === 'select' ? /** SelectionMode.Full */ undefined : undefined}
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        gap={24}
                        size={1}
                        color="#cbd5e1"
                        className="opacity-40"
                    />

                    <Controls className="bg-white! border-stone-200! shadow-sm! rounded-lg! overflow-hidden">
                        <ControlButton 
                            onClick={() => onLayout('LR')}
                            title="自动一键布局 (XMind 模式)"
                            className="bg-white hover:bg-stone-50 transition-colors"
                        >
                            <Sparkles size={14} className="text-amber-500" />
                        </ControlButton>
                    </Controls>


                </ReactFlow>
            </div>

            {/* Paper Texture Overlay */}
            <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E")`,
                }}
            />
        </div >
    );
};
