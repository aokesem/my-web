import { Node, Edge, MarkerType } from 'reactflow';

export const STYLE_PRESETS = {
    colors: [
        { id: 'blue', label: '专业蓝', bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-700', shadow: 'shadow-blue-200' },
        { id: 'emerald', label: '清新绿', bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600', shadow: 'shadow-emerald-200' },
        { id: 'amber', label: '活力橙', bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600', shadow: 'shadow-amber-200' },
        { id: 'rose', label: '热情红', bg: 'bg-rose-500', text: 'text-white', border: 'border-rose-600', shadow: 'shadow-rose-100' },
        { id: 'slate', label: '商务灰', bg: 'bg-slate-700', text: 'text-white', border: 'border-slate-800', shadow: 'shadow-slate-200' },
        { id: 'white', label: '极简白', bg: 'bg-white', text: 'text-stone-800', border: 'border-stone-200', shadow: 'shadow-stone-100' },
    ],
    borderWeights: [
        { id: 'normal', label: '标准', width: 1, radius: 'rounded-xl' },
        { id: 'heavy', label: '加粗', width: 2, radius: 'rounded-2xl' },
    ]
};

export const INITIAL_NODES: Node[] = [
    { id: '1', type: 'modern', position: { x: 400, y: 100 }, data: { id: '01', label: '核心目标: 出行指南', colorId: 'blue' } },
    { id: '2', type: 'modern', position: { x: 150, y: 300 }, data: { id: '02', label: '交通选型: 轨道交通', colorId: 'emerald' } },
    { id: '3', type: 'modern', position: { x: 650, y: 300 }, data: { id: '03', label: '住宿定位: 艺术酒店', colorId: 'amber' } },
    { id: '4', type: 'modern', position: { x: 50, y: 500 }, data: { id: '04', label: '路线 A: 沿海步道', colorId: 'white' } },
    { id: '5', type: 'modern', position: { x: 250, y: 500 }, data: { id: '05', label: '路线 B: 城市中心', colorId: 'white' } },
];

export const INITIAL_EDGES: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, markerEnd: { type: MarkerType.Arrow, color: '#94a3b8' }, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
    { id: 'e1-3', source: '1', target: '3', markerEnd: { type: MarkerType.Arrow, color: '#94a3b8' }, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
    { id: 'e2-4', source: '2', target: '4', markerEnd: { type: MarkerType.Arrow, color: '#94a3b8' }, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
    { id: 'e2-5', source: '2', target: '5', markerEnd: { type: MarkerType.Arrow, color: '#94a3b8' }, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
];
