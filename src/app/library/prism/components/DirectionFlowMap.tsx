'use client';

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import ReactFlow, {
    Background, BackgroundVariant,
    Handle, Position, NodeProps, Edge, Node, MarkerType,
    PanOnScrollMode,
    useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { HelpCircle, Pencil, X, Check } from 'lucide-react';
import type { ResearchQuestion, InnovationPoint, PaperDetail } from '../types';

// ============================================================
// CUSTOM NODES — XMind style: solid color + text only
// ============================================================

const handleClass = "opacity-0! w-2! h-2!";

// Editable node: hover shows edit/delete, click edit -> textarea
function EditableNode({ data, bgColor }: NodeProps & { bgColor: string }) {
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(data.label);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { setText(data.label); }, [data.label]);
    useEffect(() => { if (editing && textareaRef.current) textareaRef.current.focus(); }, [editing]);

    const save = () => {
        setEditing(false);
        if (text.trim() && text !== data.label) data.onEdit?.(data.entityId, text.trim());
    };

    return (
        <div className={`${bgColor} rounded-xl px-4 py-3 shadow-md group relative`} style={{ width: data.nodeWidth || 220 }}>
            <Handle type="target" position={Position.Left} className={handleClass} />
            {/* Hover action buttons */}
            {data.onEdit && !editing && (
                <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 z-10">
                    <button onClick={(e) => { e.stopPropagation(); setEditing(true); }} className="w-5 h-5 rounded-md bg-white/90 shadow flex items-center justify-center hover:bg-blue-50">
                        <Pencil size={10} className="text-stone-600" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); data.onDelete?.(data.entityId); }} className="w-5 h-5 rounded-md bg-white/90 shadow flex items-center justify-center hover:bg-red-50">
                        <X size={10} className="text-red-500" />
                    </button>
                </div>
            )}
            {editing ? (
                <div>
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Escape') { setText(data.label); setEditing(false); } }}
                        className="w-full bg-white/20 rounded-lg p-1 text-[13px] font-semibold text-white leading-snug resize-none outline-none border border-white/30 min-h-[36px]"
                        rows={2}
                    />
                    <div className="flex justify-end gap-1 mt-1">
                        <button onClick={() => { setText(data.label); setEditing(false); }} className="w-5 h-5 rounded bg-white/20 flex items-center justify-center hover:bg-white/40">
                            <X size={10} className="text-white" />
                        </button>
                        <button onClick={save} className="w-5 h-5 rounded bg-white/30 flex items-center justify-center hover:bg-green-500/60">
                            <Check size={10} className="text-white" />
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-[13px] font-semibold text-white leading-snug">{text}</p>
            )}
            <Handle type="source" position={Position.Right} className={handleClass} />
        </div>
    );
}

function QuestionNode(props: NodeProps) {
    return <EditableNode {...props} bgColor="bg-[#2563EB]" />;
}

function PaperFlowNode({ data }: NodeProps) {
    return (
        <div className="bg-[#DC2626] rounded-xl px-4 py-3 w-[200px] shadow-md cursor-pointer hover:brightness-110 transition-all">
            <Handle type="target" position={Position.Left} className={handleClass} />
            <p className="text-[13px] font-semibold text-white leading-snug line-clamp-2">{data.label}</p>
            <Handle type="source" position={Position.Right} className={handleClass} />
        </div>
    );
}

function InnovationFlowNode(props: NodeProps) {
    return <EditableNode {...props} bgColor="bg-[#D97706]" />;
}

const nodeTypes = { question: QuestionNode, paper: PaperFlowNode, innovation: InnovationFlowNode };

// ============================================================
// DAGRE LAYOUT WITH RANK CONSTRAINTS
// X = fixed 3 columns; Y = dagre auto (smart edge crossing minimization)
// ============================================================

import dagre from 'dagre';

// Column X positions — adjust these to tune horizontal spacing
const COL_X: Record<string, number> = { question: -100, paper: 320, innovation: 740 };

function estimateHeight(text: string): number {
    const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const latin = text.length - cjk;
    const textWidth = cjk * 14 + latin * 8;
    const lines = Math.ceil(textWidth / 180);
    return Math.max(64, lines * 20 + 48);
}

function buildLayout(questions: ResearchQuestion[], innovationPoints: InnovationPoint[], allPapers: PaperDetail[], callbacks?: { onEdit?: (id: string, content: string) => void; onDelete?: (id: string) => void }) {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 160, marginx: 30, marginy: 30 });

    // Track node types for X override after dagre
    const nodeTypeMap = new Map<string, string>();

    // --- 1. Question nodes (rank 0) ---
    questions.forEach(q => {
        const h = estimateHeight(q.content);
        g.setNode(`q-${q.id}`, { width: 220, height: h });
        nodeTypeMap.set(`q-${q.id}`, 'question');
    });

    // --- 2. Paper nodes (rank 1) + Q→P edges ---
    const paperSet = new Set<string>();
    questions.forEach(q => {
        q.paper_ids.forEach(pid => {
            const paper = allPapers.find(p => p.id === pid);
            if (!paper) return;
            if (!paperSet.has(pid)) {
                paperSet.add(pid);
                g.setNode(`p-${pid}`, { width: 200, height: 70 });
                nodeTypeMap.set(`p-${pid}`, 'paper');
            }
            g.setEdge(`q-${q.id}`, `p-${pid}`);
        });
    });

    // --- 3. Innovation nodes (rank 2) ---
    innovationPoints.forEach(ip => {
        const h = estimateHeight(ip.content);
        g.setNode(`i-${ip.id}`, { width: 200, height: h });
        nodeTypeMap.set(`i-${ip.id}`, 'innovation');

        if (ip.paper_id && paperSet.has(ip.paper_id)) {
            // Paper → Innovation edge (natural rank 2)
            g.setEdge(`p-${ip.paper_id}`, `i-${ip.id}`);
        } else {
            // No paper: insert invisible dummy at paper rank to force rank 2
            const dummyId = `_d_${ip.id}`;
            g.setNode(dummyId, { width: 1, height: 1 });
            nodeTypeMap.set(dummyId, '_dummy');
            g.setEdge(`q-${ip.question_id}`, dummyId);
            g.setEdge(dummyId, `i-${ip.id}`);
        }
    });

    dagre.layout(g);

    // --- Build React Flow nodes (skip dummies), override X to fixed columns ---
    const flowNodes: Node[] = [];
    const blueEdge = { style: { stroke: '#93c5fd', strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#93c5fd', width: 14, height: 14 } };
    const amberEdge = { style: { stroke: '#fbbf24', strokeWidth: 1.5 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#fbbf24', width: 14, height: 14 } };

    let maxY = 0;
    g.nodes().forEach(id => {
        const type = nodeTypeMap.get(id)!;
        if (type === '_dummy') return;

        const dagreNode = g.node(id);
        const x = COL_X[type] ?? 0;
        const y = dagreNode.y - dagreNode.height / 2;
        if (y + dagreNode.height > maxY) maxY = y + dagreNode.height;

        const baseData: any = { label: '', onEdit: callbacks?.onEdit, onDelete: callbacks?.onDelete };

        if (type === 'question') {
            const q = questions.find(q => `q-${q.id}` === id);
            baseData.label = q?.content || '';
            baseData.entityId = q?.id;
            baseData.nodeWidth = 220;
        } else if (type === 'paper') {
            const pid = id.replace('p-', '');
            const paper = allPapers.find(p => p.id === pid);
            baseData.label = paper?.nickname || paper?.title || '';
            baseData.year = paper?.year;
            baseData.readDepth = paper?.read_depth;
            baseData.paperId = pid;
        } else if (type === 'innovation') {
            const ip = innovationPoints.find(ip => `i-${ip.id}` === id);
            baseData.label = ip?.content || '';
            baseData.entityId = ip?.id;
            baseData.nodeWidth = 200;
        }

        flowNodes.push({ id, type, position: { x, y }, data: baseData });
    });

    // --- Build React Flow edges (real connections only, no dummy edges) ---
    const flowEdges: Edge[] = [];
    questions.forEach(q => {
        q.paper_ids.forEach(pid => {
            if (paperSet.has(pid)) {
                flowEdges.push({ id: `eq-${q.id}-p-${pid}`, source: `q-${q.id}`, target: `p-${pid}`, ...blueEdge });
            }
        });
    });
    innovationPoints.forEach(ip => {
        const src = ip.paper_id && paperSet.has(ip.paper_id) ? `p-${ip.paper_id}` : `q-${ip.question_id}`;
        flowEdges.push({ id: `ei-${src}-i-${ip.id}`, source: src, target: `i-${ip.id}`, ...amberEdge });
    });

    return { nodes: flowNodes, edges: flowEdges, totalHeight: maxY + 40 };
}

// ============================================================
// SCROLL INDICATOR
// ============================================================

function ScrollIndicator({ totalH, containerH }: { totalH: number; containerH: number }) {
    const { getViewport, setViewport } = useReactFlow();
    const [thumbPos, setThumbPos] = useState({ top: 0, height: 0 });
    const [visible, setVisible] = useState(false);
    const isDragging = useRef(false);
    const dragStartY = useRef(0);
    const dragStartThumbTop = useRef(0);
    const trackRef = useRef<HTMLDivElement>(null);

    // Update thumb position whenever viewport changes
    const updateThumb = useCallback(() => {
        if (containerH <= 0 || totalH <= 0) { setVisible(false); return; }
        const vp = getViewport();
        const visibleH = containerH / vp.zoom;
        if (totalH <= visibleH) { setVisible(false); return; }
        setVisible(true);
        const trackH = containerH - 16;
        const viewTop = -vp.y / vp.zoom;
        const thumbH = Math.max(24, (visibleH / totalH) * trackH);
        const thumbTop = Math.max(0, Math.min(trackH - thumbH, (viewTop / totalH) * trackH));
        setThumbPos({ top: thumbTop, height: thumbH });
    }, [containerH, totalH, getViewport]);

    // Poll viewport position (React Flow doesn't have a perfect onMove for panOnScroll)
    useEffect(() => {
        const interval = setInterval(updateThumb, 60);
        return () => clearInterval(interval);
    }, [updateThumb]);

    // Drag handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging.current = true;
        dragStartY.current = e.clientY;
        dragStartThumbTop.current = thumbPos.top;
        document.body.style.cursor = 'pointer';
        document.body.style.userSelect = 'none';
    }, [thumbPos.top]);

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            const trackH = containerH - 16;
            const delta = e.clientY - dragStartY.current;
            const newTop = Math.max(0, Math.min(trackH - thumbPos.height, dragStartThumbTop.current + delta));
            const vp = getViewport();
            const newViewY = -(newTop / trackH * totalH) * vp.zoom;
            setViewport({ x: vp.x, y: newViewY, zoom: vp.zoom }, { duration: 0 });
        };
        const onUp = () => {
            if (!isDragging.current) return;
            isDragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    }, [containerH, totalH, thumbPos.height, getViewport, setViewport]);

    if (!visible) return null;

    return (
        <div ref={trackRef} className="absolute top-2 right-2 bottom-2 w-1.5 rounded-full bg-stone-200/40 z-30">
            <div
                onMouseDown={handleMouseDown}
                className="absolute w-full rounded-full bg-stone-400/60 hover:bg-stone-500 cursor-pointer transition-colors"
                style={{ top: thumbPos.top, height: thumbPos.height }}
            />
        </div>
    );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

interface DirectionFlowMapProps {
    questions: ResearchQuestion[];
    innovationPoints: InnovationPoint[];
    allPapers: PaperDetail[];
    onOpenPaper: (id: string) => void;
    onEditNode?: (id: string, content: string) => void;
    onDeleteNode?: (id: string) => void;
}

export default function DirectionFlowMap({ questions, innovationPoints, allPapers, onOpenPaper, onEditNode, onDeleteNode }: DirectionFlowMapProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [wrapperH, setWrapperH] = useState(0);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const ro = new ResizeObserver(e => setWrapperH(e[0].contentRect.height));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const callbacks = useMemo(() => ({ onEdit: onEditNode, onDelete: onDeleteNode }), [onEditNode, onDeleteNode]);
    const { nodes, edges, totalHeight } = useMemo(
        () => buildLayout(questions, innovationPoints, allPapers, callbacks),
        [questions, innovationPoints, allPapers]
    );

    // Calculate translate extent to prevent scrolling past content
    const translateExtent = useMemo((): [[number, number], [number, number]] => {
        if (nodes.length === 0) return [[-Infinity, -Infinity], [Infinity, Infinity]];
        const ys = nodes.map(n => n.position.y);
        const minY = Math.min(...ys) - 20;
        const maxY = totalHeight + 20;
        return [[-Infinity, minY], [Infinity, maxY]];
    }, [nodes, totalHeight]);

    if (nodes.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-stone-300">
                <div className="text-center">
                    <HelpCircle size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-mono">暂无研究问题数据</p>
                    <p className="text-xs mt-1 opacity-60">请在 Admin 面板中添加研究问题</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full" ref={wrapperRef}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={(_, node) => { if (node.type === 'paper' && node.data.paperId) onOpenPaper(node.data.paperId); }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag={false}
                panOnScroll
                panOnScrollMode={PanOnScrollMode.Vertical}
                zoomOnScroll={false}
                zoomOnDoubleClick={false}
                translateExtent={translateExtent}
                fitView
                fitViewOptions={{ padding: 0.08, maxZoom: 1 }}
                minZoom={0.5}
                maxZoom={1}
                proOptions={{ hideAttribution: true }}
            >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#d4d4d8" className="opacity-30" />
            </ReactFlow>
            <ScrollIndicator totalH={totalHeight} containerH={wrapperH} />
        </div>
    );
}
