import React, { useRef, useState, useEffect } from 'react';
import { NodeProps, Handle, Position, useReactFlow, useUpdateNodeInternals } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, Plus, ChevronDown, Check, X } from 'lucide-react';
import { STYLE_PRESETS } from '../constants';

export const ModernNode = ({ id, data, selected }: NodeProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(data.label || '');
    const { setNodes, setEdges } = useReactFlow();
    const updateNodeInternals = useUpdateNodeInternals();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync editText with data.label
    useEffect(() => {
        if (!isEditing) setEditText(data.label || '');
    }, [data.label, isEditing]);

    // Auto-enter edit mode for newly created nodes
    useEffect(() => {
        if (data.isNew) {
            setIsEditing(true);
            // Clear the flag so it doesn't re-trigger
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, isNew: false } } : n));
        }
    }, [data.isNew, id, setNodes]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
            // Trigger auto-resize
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [isEditing]);

    const activeColor = STYLE_PRESETS.colors.find(c => c.id === data.colorId) || STYLE_PRESETS.colors[0];
    const activeWeight = STYLE_PRESETS.borderWeights.find(w => w.id === data.borderWeightId) || STYLE_PRESETS.borderWeights[0];

    const handleSubmit = () => {
        setIsEditing(false);
        if (editText.trim() === data.label) return;
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, label: editText.trim() } } : n));
        requestAnimationFrame(() => updateNodeInternals(id));
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('确定删除这个节点？')) return;
        setNodes(nds => nds.filter(n => n.id !== id));
        setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    };

    const handleAddChild = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newId = `node-${Date.now()}`;
        const newNode = {
            id: newId,
            type: 'modern',
            position: { x: data.x + 250, y: data.y }, // Default offset
            data: { label: '新子节点', colorId: data.colorId }
        };
        const newEdge = {
            id: `e-${id}-${newId}`,
            source: id,
            target: newId,
            style: { stroke: '#94a3b8', strokeWidth: 1.5 }
        };
        setNodes(nds => [...nds, newNode]);
        setEdges(eds => [...eds, newEdge]);
    };

    return (
        <div 
            className={`group relative min-w-[120px] max-w-[300px] transition-all duration-300 ${selected ? 'z-50' : 'z-10'}`}
            onDoubleClick={() => setIsEditing(true)}
        >
            {/* Main Content Box */}
            <div className={`
                relative px-5 py-3 shadow-lg transition-all duration-300
                ${activeColor.bg} ${activeColor.text} ${activeColor.border} border
                ${activeWeight.radius} ${selected ? `ring-2 ring-sky-400 ring-offset-2 scale-[1.02] ${activeColor.shadow}` : 'hover:shadow-xl hover:-translate-y-0.5'}
            `}>
                <Handle type="target" position={Position.Left} className="w-2 h-2 bg-slate-300! border-white! opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {isEditing ? (
                    <div className="flex flex-col gap-2">
                        <textarea
                            ref={textareaRef}
                            value={editText}
                            onChange={(e) => {
                                setEditText(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onBlur={handleSubmit}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                                if (e.key === 'Escape') {
                                    setEditText(data.label);
                                    setIsEditing(false);
                                }
                            }}
                            className="nodrag nowheel w-full bg-white/20 border-none focus:ring-1 focus:ring-white/40 text-[14px] font-bold text-current resize-none p-1 rounded outline-none leading-relaxed overflow-hidden"
                            style={{ minHeight: '1.5em' }}
                        />
                        <div className="flex justify-end gap-1">
                            <button onClick={handleSubmit} className="p-0.5 rounded hover:bg-white/20 transition-colors"><Check size={14} /></button>
                            <button onClick={() => setIsEditing(false)} className="p-0.5 rounded hover:bg-white/20 transition-colors"><X size={14} /></button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col py-1">
                        <h3 className={`text-[14px] leading-relaxed whitespace-pre-wrap ${data.fontWeight === 'bold' ? 'font-black' : 'font-bold'}`}>
                            {data.label}
                        </h3>
                    </div>
                )}

                <Handle type="source" position={Position.Right} className="w-2 h-2 bg-slate-300! border-white! opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Quick Actions (Floating) */}
                <AnimatePresence>
                    {!isEditing && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            whileHover={{ opacity: 1, y: 0 }}
                            className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-stone-200 px-2 py-1 rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-all z-50 pointer-events-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <button onClick={() => setIsEditing(true)} className="p-1.5 text-stone-500 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-colors" title="编辑内容"><Pencil size={14} /></button>
                            <button onClick={handleAddChild} className="p-1.5 text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors" title="添加子节点"><Plus size={14} /></button>
                            <div className="w-px h-3 bg-stone-200 mx-0.5" />
                            <button onClick={handleDelete} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="删除节点"><Trash2 size={14} /></button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Selection Indicator Tail */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-sky-500 border-2 border-white rounded-full shadow-sm z-50"
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
