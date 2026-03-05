import { Node, Edge, MarkerType } from 'reactflow';

export const STYLE_PRESETS = {
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

export const INITIAL_NODES: Node[] = [
    { id: '1', type: 'rough', position: { x: 400, y: 100 }, data: { id: '01', label: '核心目标: 出行指南', type: 'CORE_ANCHOR' } },
    { id: '2', type: 'rough', position: { x: 150, y: 300 }, data: { id: '02', label: '交通选型: 轨道交通', type: 'LOGISTICS' } },
    { id: '3', type: 'rough', position: { x: 650, y: 300 }, data: { id: '03', label: '住宿定位: 艺术酒店', type: 'LODGING' } },
    { id: '4', type: 'rough', position: { x: 50, y: 500 }, data: { id: '04', label: '路线 A: 沿海步道', type: 'PATH_VAL_01' } },
    { id: '5', type: 'rough', position: { x: 250, y: 500 }, data: { id: '05', label: '路线 B: 城市中心', type: 'PATH_VAL_02' } },
];

export const INITIAL_EDGES: Edge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true, markerEnd: { type: MarkerType.ArrowClosed, color: '#d1d5db' } },
    { id: 'e1-3', source: '1', target: '3', markerEnd: { type: MarkerType.ArrowClosed, color: '#d1d5db' } },
    { id: 'e2-4', source: '2', target: '4', markerEnd: { type: MarkerType.ArrowClosed, color: '#d1d5db' } },
    { id: 'e2-5', source: '2', target: '5', markerEnd: { type: MarkerType.ArrowClosed, color: '#d1d5db' } },
];
