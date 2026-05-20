import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, X, Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { InfoCategory } from '../types';

interface InfoItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    formMode: 'create' | 'edit';
    formData: any;
    setFormData: (data: any) => void;
    isSaving: boolean;
    handleSave: () => void;
    theme: any;
    currentCategories: InfoCategory[];
    type: string;
}

export function InfoItemModal({
    isOpen,
    onClose,
    formMode,
    formData,
    setFormData,
    isSaving,
    handleSave,
    theme,
    currentCategories,
    type,
}: InfoItemModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
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
                            <button
                                type="button"
                                onClick={onClose}
                                className={`absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 ${theme.textMuted}`}
                            >
                                <X size={20} />
                            </button>
                        )}
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            {formMode === 'create' ? (
                                <Plus size={24} className={theme.primary} />
                            ) : (
                                <Edit size={24} className={theme.primary} />
                            )}
                            {formMode === 'create' ? '新收藏夹' : '编辑收藏夹'}{' '}
                            <span className="text-sm font-mono font-normal opacity-70">Folder</span>
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>
                                    TITLE / 标题*
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="例如：某专题入口"
                                    className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none focus:${theme.primaryBorder} focus:ring-1 focus:ring-current text-sm disabled:opacity-50`}
                                    disabled={isSaving}
                                />
                            </div>

                            <div>
                                <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>
                                    CATEGORY / 功能专栏
                                </label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) =>
                                        setFormData({ ...formData, category_id: e.target.value })
                                    }
                                    className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none text-sm disabled:opacity-50`}
                                    disabled={isSaving}
                                >
                                    <option value="">未选择</option>
                                    {currentCategories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>
                                    COVER / 配图
                                </label>
                                <ImageUpload
                                    value={formData.image_url}
                                    onChange={(url) => setFormData({ ...formData, image_url: url })}
                                    bucket="info_images"
                                    folder={type}
                                />
                            </div>

                            <div>
                                <label className={`block text-xs font-bold mb-1.5 ${theme.textMuted}`}>
                                    NOTE / 描述
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    placeholder="摘要或备忘…"
                                    rows={2}
                                    className={`w-full px-4 py-3 rounded-xl border ${theme.border} bg-transparent outline-none focus:${theme.primaryBorder} focus:ring-1 focus:ring-current text-sm resize-none disabled:opacity-50`}
                                    disabled={isSaving}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 pointer-events-auto">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSaving}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-bold border ${theme.border} ${theme.textMuted} hover:${theme.cardHover} transition-colors disabled:opacity-50`}
                                >
                                    取消
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md ${theme.activePill} hover:opacity-90 transition-opacity disabled:opacity-70`}
                                >
                                    {isSaving && <Loader2 size={16} className="animate-spin" />}
                                    {isSaving ? '保存中…' : '确认'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
