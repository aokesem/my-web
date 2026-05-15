'use client';

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import ReactFlow, {
    Background, BackgroundVariant,
    Handle, Position, NodeProps, Edge, Node, MarkerType,
    PanOnScrollMode,
    useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { HelpCircle } from 'lucide-react';
import type {
    ProjectAgendaSurveyItem,
    ProjectAgendaSynthesisItem,
    ProjectInsight,
} from '../types';

// ============================================================
// READ-ONLY NODES
// ============================================================

const handleClass = 'opacity-0! w-2! h-2!';

function FlowNode({ data, bgColor }: NodeProps & { bgColor: string }) {
    return (
        <div
            className={`${bgColor} rounded-xl px-4 py-3 shadow-md`}
            style={{ width: data.nodeWidth || 220 }}
        >
            <Handle type="target" position={Position.Left} className={handleClass} />
            <p className="text-[13px] font-semibold text-white leading-snug whitespace-pre-wrap">{data.label}</p>
            <Handle type="source" position={Position.Right} className={handleClass} />
        </div>
    );
}

function SurveyNode(props: NodeProps) {
    return <FlowNode {...props} bgColor="bg-[#2563EB]" />;
}

function InsightNode(props: NodeProps) {
    return <FlowNode {...props} bgColor="bg-[#DC2626]" />;
}

function SynthesisNode(props: NodeProps) {
    return <FlowNode {...props} bgColor="bg-[#D97706]" />;
}

const nodeTypes = { survey: SurveyNode, insight: InsightNode, synthesis: SynthesisNode };

// ============================================================
// FOREST LAYOUT — one tree per 调查方向 (XMind-style, no shared trunks)
// ============================================================

const COL_X: Record<string, number> = { survey: -100, insight: 320, synthesis: 740 };
const TREE_GAP = 56;

function estimateHeight(text: string, width = 180): number {
    const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const latin = text.length - cjk;
    const textWidth = cjk * 14 + latin * 8;
    const lines = Math.ceil(textWidth / width);
    return Math.max(64, lines * 20 + 48);
}

const violetEdge = {
    type: 'smoothstep' as const,
    style: { stroke: '#93c5fd', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#93c5fd', width: 14, height: 14 },
};

const amberEdge = {
    type: 'smoothstep' as const,
    style: { stroke: '#fbbf24', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#fbbf24', width: 14, height: 14 },
};

function insightNodeId(surveyId: string, insightId: string) {
    return `i-${surveyId}-${insightId}`;
}

function synthesisNodeId(surveyId: string, insightId: string, synthesisId: string) {
    return `y-${surveyId}-${insightId}-${synthesisId}`;
}

/** 单棵调查方向子树：调查 → 启示* → 综合*（综合可重复出现在不同启示枝下） */
function layoutSurveyTree(
    survey: ProjectAgendaSurveyItem,
    insights: ProjectInsight[],
    synthesisItems: ProjectAgendaSynthesisItem[],
): { nodes: Node[]; edges: Edge[]; minY: number; maxY: number } {
    const insightsForSurvey = insights.filter((ins) => ins.survey_ids.includes(survey.id));

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'LR', nodesep: 36, ranksep: 150, marginx: 24, marginy: 24 });

    const meta = new Map<string, { type: 'survey' | 'insight' | 'synthesis'; label: string; nodeWidth: number }>();

    const rootId = `s-${survey.id}`;
    const surveyLabel = survey.title?.trim() || '(无标题)';
    g.setNode(rootId, { width: 220, height: estimateHeight(surveyLabel) });
    meta.set(rootId, { type: 'survey', label: surveyLabel, nodeWidth: 220 });

    for (const ins of insightsForSurvey) {
        const iId = insightNodeId(survey.id, ins.id);
        const insLabel = ins.title?.trim() || '(无标题)';
        g.setNode(iId, { width: 200, height: estimateHeight(insLabel, 160) });
        meta.set(iId, { type: 'insight', label: insLabel, nodeWidth: 200 });
        g.setEdge(rootId, iId);

        for (const syn of synthesisItems) {
            if (!syn.insight_ref_ids.includes(ins.id)) continue;
            const yId = synthesisNodeId(survey.id, ins.id, syn.id);
            const synLabel = syn.content?.trim() || '(暂无正文)';
            g.setNode(yId, { width: 200, height: estimateHeight(synLabel, 160) });
            meta.set(yId, { type: 'synthesis', label: synLabel, nodeWidth: 200 });
            g.setEdge(iId, yId);
        }
    }

    dagre.layout(g);

    let minY = Infinity;
    let maxY = -Infinity;
    const nodes: Node[] = [];

    g.nodes().forEach((id) => {
        const m = meta.get(id)!;
        const dagreNode = g.node(id);
        const x = COL_X[m.type];
        const y = dagreNode.y - dagreNode.height / 2;
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + dagreNode.height);
        nodes.push({
            id,
            type: m.type,
            position: { x, y },
            data: { label: m.label, nodeWidth: m.nodeWidth },
        });
    });

    const edges: Edge[] = g.edges().map((e) => {
        const targetId = e.w;
        const isSynth = targetId.startsWith('y-');
        return {
            id: `e-${e.v}-${targetId}`,
            source: e.v,
            target: targetId,
            ...(isSynth ? amberEdge : violetEdge),
        };
    });

    if (!Number.isFinite(minY)) {
        minY = 0;
        maxY = estimateHeight(surveyLabel);
    }
    return { nodes, edges, minY, maxY };
}

function buildAgendaChainLayout(
    surveys: ProjectAgendaSurveyItem[],
    insights: ProjectInsight[],
    synthesisItems: ProjectAgendaSynthesisItem[],
) {
    if (surveys.length === 0) {
        return { nodes: [] as Node[], edges: [] as Edge[], totalHeight: 0 };
    }

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    let yOffset = 0;

    for (const survey of surveys) {
        const tree = layoutSurveyTree(survey, insights, synthesisItems);

        if (tree.nodes.length === 0) continue;

        const shift = yOffset - tree.minY;
        tree.nodes.forEach((n) => {
            flowNodes.push({
                ...n,
                position: { x: n.position.x, y: n.position.y + shift },
            });
        });
        tree.edges.forEach((e) => flowEdges.push(e));

        yOffset = tree.maxY + shift + TREE_GAP;
    }

    const totalHeight = flowNodes.length > 0
        ? Math.max(...flowNodes.map((n) => {
            const h = n.type === 'survey' ? estimateHeight(n.data.label as string) : estimateHeight(n.data.label as string, 160);
            return n.position.y + h;
        })) + 40
        : 0;

    return { nodes: flowNodes, edges: flowEdges, totalHeight };
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

    useEffect(() => {
        const interval = setInterval(updateThumb, 60);
        return () => clearInterval(interval);
    }, [updateThumb]);

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
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [containerH, totalH, thumbPos.height, getViewport, setViewport]);

    if (!visible) return null;

    return (
        <div className="absolute top-2 right-2 bottom-2 w-1.5 rounded-full bg-stone-200/40 z-30">
            <div
                onMouseDown={handleMouseDown}
                className="absolute w-full rounded-full bg-stone-400/60 hover:bg-stone-500 cursor-pointer transition-colors"
                style={{ top: thumbPos.top, height: thumbPos.height }}
            />
        </div>
    );
}

// ============================================================
// MAIN
// ============================================================

interface AgendaChainFlowMapProps {
    surveys: ProjectAgendaSurveyItem[];
    insights: ProjectInsight[];
    synthesisItems: ProjectAgendaSynthesisItem[];
}

export default function AgendaChainFlowMap({ surveys, insights, synthesisItems }: AgendaChainFlowMapProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [wrapperH, setWrapperH] = useState(0);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const ro = new ResizeObserver((e) => setWrapperH(e[0].contentRect.height));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const { nodes, edges, totalHeight } = useMemo(
        () => buildAgendaChainLayout(surveys, insights, synthesisItems),
        [surveys, insights, synthesisItems],
    );

    const translateExtent = useMemo((): [[number, number], [number, number]] => {
        if (nodes.length === 0) return [[-Infinity, -Infinity], [Infinity, Infinity]];
        const ys = nodes.map((n) => n.position.y);
        const minY = Math.min(...ys) - 20;
        const maxY = totalHeight + 20;
        return [[-Infinity, minY], [Infinity, maxY]];
    }, [nodes, totalHeight]);

    if (nodes.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-stone-300">
                <div className="text-center">
                    <HelpCircle size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-mono">暂无议程链数据</p>
                    <p className="text-xs mt-1 opacity-60">请在项目看板中填写调查方向、启示与综合条目</p>
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
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag={false}
                panOnScroll
                panOnScrollMode={PanOnScrollMode.Vertical}
                zoomOnScroll={false}
                zoomOnDoubleClick={false}
                translateExtent={translateExtent}
                defaultViewport={{ x: 200, y: 20, zoom: 1 }}
                minZoom={0.8}
                maxZoom={1.2}
                proOptions={{ hideAttribution: true }}
            >
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#d4d4d8" className="opacity-30" />
            </ReactFlow>
            <ScrollIndicator totalH={totalHeight} containerH={wrapperH} />
        </div>
    );
}
