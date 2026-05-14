import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, X, Loader2 } from 'lucide-react';
import { InfoItem, InfoSource, InfoSourceGroup, InfoCategory } from '../types';
import { itemBelongsToFolder } from '../lib/infoSourceFolders';

interface BookmarkModalProps {
    isOpen: boolean;
    onClose: () => void;
    formMode: 'create' | 'edit';
    formData: any;
    setFormData: (data: any) => void;
    isSaving: boolean;
    handleSave: () => void;
    theme: any;
    mockGroups: InfoSourceGroup[];
    mockSources: InfoSource[];
    mockItems: InfoItem[];
    currentCategories: InfoCategory[];
}

export function BookmarkModal({
    isOpen, onClose, formMode, formData, setFormData,
    isSaving, handleSave, theme, mockGroups, mockSources, mockItems, currentCategories
}: BookmarkModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => !isSaving && onClose()}
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className={`relative w-full max-w-lg p-8 rounded-3xl shadow-2xl ${theme.cardBg} border ${theme.border} z-10`}
                    >
                        {!isSaving && (
                            <button onClick={onClose} className={`absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 ${theme.textMuted}`}>
                                <X size={20} />
                            </button>
                        )}
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            {formMode === 'create' ? <Plus size={24} className={theme.primary} /> : <Edit size={24} className={theme.primary} />}
                            {formMode === 'create' ? '新条目' : '编辑条目'} <span className="text-sm font-mono font-normal opacity-70">Entry</span>
                        </h2>
                        
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1 -mx-1 hide-scrollbar">
                            <div>
                                <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>TITLE / 收藏标题*</label>
                                <input 
                                    type="text" 
                                    value={formData.title} 
                                    onChange={e => setFormData({...formData, title: e.target.value})}
                                    placeholder="例如: 如何在 React 中使用 Framer Motion" 
                                    className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none focus:${theme.primaryBorder} focus:ring-1 focus:ring-current text-sm disabled:opacity-50`} 
                                    disabled={isSaving}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>URL / 源链接</label>
                                    <input 
                                        type="text" 
                                        value={formData.url}
                                        onChange={e => setFormData({...formData, url: e.target.value})}
                                        placeholder="https://..." 
                                        className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none focus:${theme.primaryBorder} focus:ring-1 focus:ring-current text-sm disabled:opacity-50`} 
                                        disabled={isSaving}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>CATEGORY / 功能专栏</label>
                                    <select 
                                        value={formData.category_id}
                                        onChange={e => setFormData({...formData, category_id: e.target.value})}
                                        className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none text-sm disabled:opacity-50`}
                                        disabled={isSaving}
                                    >
                                        <option value="">未选择专栏</option>
                                        {currentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            
                            {/* 收藏夹 + 可选关联主卡片 */}
                            <div className="pt-2 pb-1 border-t border-b border-black/5 dark:border-white/5 space-y-3">
                                <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>FOLDER / 收藏夹 <span className="font-mono opacity-70">(optional)</span></label>
                                
                                <div>
                                    <select 
                                        value={formData.group_id}
                                        onChange={e => setFormData({...formData, group_id: e.target.value, parent_item_id: ''})}
                                        className={`w-full px-3 py-2 rounded-lg border ${theme.border} bg-transparent outline-none text-xs disabled:opacity-50`}
                                    >
                                        <option value="">未指定收藏夹</option>
                                        {mockGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>

                                {formData.group_id && (() => {
                                    const gid = parseInt(formData.group_id, 10);
                                    const itemsInFolder = mockItems.filter(i => itemBelongsToFolder(i, gid, mockSources));
                                    if (itemsInFolder.length === 0) return null;
                                    return (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                            <label className={`block text-[10px] font-bold mb-1 ${theme.textMuted}`}>LINK / 关联主卡片 <span className="font-mono">(optional)</span></label>
                                            <select 
                                                value={formData.parent_item_id}
                                                onChange={e => setFormData({...formData, parent_item_id: e.target.value})}
                                                className={`w-full px-3 py-2 rounded-lg border ${theme.border} bg-transparent outline-none text-xs disabled:opacity-50`}
                                            >
                                                <option value="">不关联</option>
                                                {itemsInFolder.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                                            </select>
                                        </motion.div>
                                    );
                                })()}
                            </div>

                            <div>
                                <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>DESCRIPTION / 摘要与笔记</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    placeholder="记录文章的重点内容..." 
                                    rows={4} 
                                    className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none focus:${theme.primaryBorder} focus:ring-1 focus:ring-current text-sm resize-none disabled:opacity-50`} 
                                    disabled={isSaving}
                                />
                            </div>
                            
                            <div className="pt-4 flex justify-end gap-3 pointer-events-auto">
                                <button onClick={onClose} disabled={isSaving} className={`px-6 py-2.5 rounded-xl text-sm font-bold border ${theme.border} ${theme.textMuted} hover:${theme.cardHover} transition-colors disabled:opacity-50`}>
                                    取消
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md ${theme.activePill} hover:opacity-90 transition-opacity disabled:opacity-70`}>
                                    {isSaving && <Loader2 size={16} className="animate-spin" />}
                                    {isSaving ? '保存中...' : '确认保存'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
