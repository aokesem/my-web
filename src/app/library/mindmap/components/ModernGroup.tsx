import React from 'react';
import { NodeProps, NodeResizer, useReactFlow } from 'reactflow';

export const ModernGroup = ({ id, data, selected }: NodeProps) => {
    const { setNodes } = useReactFlow();

    return (
        <div className="relative w-full h-full group">
            <NodeResizer
                isVisible={selected}
                minWidth={100}
                minHeight={100}
                onResize={(evt, params) => {
                    setNodes(nds => nds.map(n => n.id === id ? {
                        ...n,
                        data: { ...n.data, width: params.width, height: params.height }
                    } : n));
                }}
                lineStyle={{ border: '1px solid #94a3b8', opacity: 0.5 }}
                handleStyle={{
                    width: 10,
                    height: 10,
                    background: '#64748b',
                    border: '2px solid white',
                    borderRadius: '3px',
                }}
            />
            
            {/* Group Container */}
            <div className={`
                w-full h-full 
                bg-stone-100/30 backdrop-blur-[2px] 
                border-2 border-dashed border-stone-200 
                rounded-3xl transition-all duration-300
                ${selected ? 'border-sky-400 bg-sky-50/20' : ''}
            `}>
                <div className="absolute -top-3 left-6 px-3 py-1 bg-white border border-stone-200 rounded-full shadow-sm">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">
                        {data.label || 'Grouping_Zone'}
                    </span>
                </div>
            </div>
        </div>
    );
};
