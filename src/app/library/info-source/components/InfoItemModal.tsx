import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, X, Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { InfoSource, InfoCategory } from '../types';

interface InfoItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    formMode: 'create' | 'edit';
    formData: any;
    setFormData: (data: any) => void;
    isSaving: boolean;
    handleSave: () => void;
    theme: any;
    mockSources: InfoSource[];
    mockGroups: any[];
    currentCategories: InfoCategory[];
    type: string;
}

export function InfoItemModal({
    isOpen, onClose, formMode, formData, setFormData,
    isSaving, handleSave, theme, mockSources, mockGroups, currentCategories, type
}: InfoItemModalProps) {
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
                            {formMode === 'create' ? '录入新信息' : '修改核心参数'}
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>INFO_NAME / 标题标识*</label>
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="例如: React最新架构解析" 
                                    className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none focus:${theme.primaryBorder} focus:ring-1 focus:ring-current text-sm disabled:opacity-50`} 
                                    disabled={isSaving}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>SOURCE / 溯源基站</label>
                                    <select 
                                        value={formData.source_id}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setFormData({...formData, source_id: val, group_id: val ? '' : formData.group_id});
                                        }}
                                        className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none text-sm disabled:opacity-50`}
                                        disabled={isSaving}
                                    >
                                        <option value="">未分类来源 (或直连大标签)</option>
                                        {mockSources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>CATEGORY / 从属矩阵</label>
                                    <select 
                                        value={formData.category_id}
                                        onChange={e => setFormData({...formData, category_id: e.target.value})}
                                        className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none text-sm disabled:opacity-50`}
                                        disabled={isSaving}
                                    >
                                        <option value="">选择子类</option>
                                        {currentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <AnimatePresence>
                                {!formData.source_id && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>GROUP / 所属聚合大标签*</label>
                                        <select 
                                            value={formData.group_id}
                                            onChange={e => setFormData({...formData, group_id: e.target.value})}
                                            className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none text-sm disabled:opacity-50`}
                                            disabled={isSaving}
                                        >
                                            <option value="">请选择挂靠大类</option>
                                            {mockGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>DATA_URL / 直接超链接</label>
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
                                    <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>INFO_DATE / 作用时间</label>
                                    <input 
                                        type="date" 
                                        value={formData.info_date}
                                        onChange={e => setFormData({...formData, info_date: e.target.value})}
                                        className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none focus:${theme.primaryBorder} focus:ring-1 focus:ring-current text-sm disabled:opacity-50`} 
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>COVER / 附加配图</label>
                                <ImageUpload 
                                    value={formData.image_url}
                                    onChange={(url) => setFormData({...formData, image_url: url})}
                                    bucket="info_images"
                                    folder={type}
                                />
                            </div>
                            
                            <div>
                                <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>NOTE / 扩展描述</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    placeholder="记录核心价值或重点摘要..." 
                                    rows={2} 
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
                                    {isSaving ? '传输中...' : '确认上传'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
