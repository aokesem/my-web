'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import ReactFlow, {
    Background, BackgroundVariant,
    Handle, Position, NodeProps, Edge, Node, MarkerType,
    PanOnScrollMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { HelpCircle, Lightbulb, BookOpen, Eye } from 'lucide-react';
import type { ResearchQuestion, InnovationPoint, PaperDetail } from '../types';

// ============================================================
// CUSTOM NODES
// ============================================================

function QuestionNode({ data }: NodeProps) {
    return (
        <div className="bg-linear-to-br from-blue-50 to-white border-2 border-blue-200 rounded-2xl px-4 py-3 shadow-[0_2px_12px_rgba(59,130,246,0.08)] w-[220px]">
            <Handle type="target" position={Position.Left} className="bg-blue-400! w-2.5! h-2.5! border-2! border-white! shadow-sm!" />
            <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-5 h-5 rounded-lg bg-blue-100 flex items-center justify-center shrink-0"><HelpCircle size={12} className="text-blue-500" /></div>
                <span className="text-[9px] font-mono font-bold text-blue-400 uppercase tracking-widest">问题</span>
            </div>
            <p className="text-[13px] font-bold text-blue-900 leading-snug">{data.label}</p>
            <Handle type="source" position={Position.Right} className="bg-blue-400! w-2.5! h-2.5! border-2! border-white! shadow-sm!" />
        </div>
    );
}

function PaperFlowNode({ data }: NodeProps) {
    return (
        <div className="bg-linear-to-br from-violet-50 to-white border-2 border-violet-200 rounded-2xl px-4 py-3 shadow-[0_2px_12px_rgba(139,92,246,0.08)] w-[200px] cursor-pointer hover:border-violet-400 hover:shadow-lg transition-all duration-200 group">
            <Handle type="target" position={Position.Left} className="bg-violet-400! w-2.5! h-2.5! border-2! border-white! shadow-sm!" />
            <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`inline-flex items-center gap-0.5 text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md ${data.readDepth === '精读' ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                    {data.readDepth === '精读' ? <BookOpen size={8} /> : <Eye size={8} />}{data.readDepth}
                </span>
                {data.year && <span className="text-[10px] font-mono text-stone-400">{data.year}</span>}
            </div>
            <p className="text-[13px] font-bold text-violet-800 leading-snug line-clamp-2 group-hover:text-violet-600 transition-colors">{data.label}</p>
            <Handle type="source" position={Position.Right} className="bg-violet-400! w-2.5! h-2.5! border-2! border-white! shadow-sm!" />
        </div>
    );
}

function InnovationFlowNode({ data }: NodeProps) {
    return (
        <div className="bg-linear-to-br from-amber-50 to-white border-2 border-amber-200 rounded-2xl px-4 py-3 shadow-[0_2px_12px_rgba(245,158,11,0.08)] w-[200px]">
            <Handle type="target" position={Position.Left} className="bg-amber-400! w-2.5! h-2.5! border-2! border-white! shadow-sm!" />
            <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-5 h-5 rounded-lg bg-amber-100 flex items-center justify-center shrink-0"><Lightbulb size={12} className="text-amber-500" /></div>
                <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-widest">创新点</span>
            </div>
            <p className="text-[13px] font-medium text-amber-900 leading-snug">{data.label}</p>
            <Handle type="source" position={Position.Right} className="bg-amber-400! w-2.5! h-2.5! border-2! border-white! shadow-sm!" />
        </div>
    );
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

function buildLayout(questions: ResearchQuestion[], innovationPoints: InnovationPoint[], allPapers: PaperDetail[]) {
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

        const baseData: any = { label: '' };

        if (type === 'question') {
            const q = questions.find(q => `q-${q.id}` === id);
            baseData.label = q?.content || '';
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

function ScrollIndicator({ viewport, totalH, containerH }: { viewport: { y: number; zoom: number }; totalH: number; containerH: number }) {
    if (containerH <= 0 || totalH <= 0) return null;
    const visibleH = containerH / viewport.zoom;
    const viewTop = -viewport.y / viewport.zoom;
    if (totalH <= visibleH) return null;

    const trackH = containerH - 16;
    const thumbH = Math.max(24, (visibleH / totalH) * trackH);
    const thumbTop = Math.max(0, Math.min(trackH - thumbH, (viewTop / totalH) * trackH));

    return (
        <div className="absolute top-2 right-2 bottom-2 w-1.5 rounded-full bg-stone-200/40 z-30 pointer-events-none">
            <div className="absolute w-full rounded-full bg-stone-400/60" style={{ top: thumbTop, height: thumbH }} />
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
}

export default function DirectionFlowMap({ questions, innovationPoints, allPapers, onOpenPaper }: DirectionFlowMapProps) {
    const [viewport, setVp] = useState({ x: 0, y: 0, zoom: 1 });
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [wrapperH, setWrapperH] = useState(0);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const ro = new ResizeObserver(e => setWrapperH(e[0].contentRect.height));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const { nodes, edges, totalHeight } = useMemo(
        () => buildLayout(questions, innovationPoints, allPapers),
        [questions, innovationPoints, allPapers]
    );

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
                fitView
                fitViewOptions={{ padding: 0.08, maxZoom: 1 }}
                minZoom={0.5}
                maxZoom={1}
                onMove={(_, vp) => setVp(vp)}
                proOptions={{ hideAttribution: true }}
            >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#d4d4d8" className="opacity-30" />
            </ReactFlow>
            <ScrollIndicator viewport={viewport} totalH={totalHeight} containerH={wrapperH} />
        </div>
    );
}
