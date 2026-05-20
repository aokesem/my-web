'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Bell } from 'lucide-react';
import { InfoItem } from '../types';
import {
    FOLDER_REMINDER_PRESETS,
    formatFolderReminderInterval,
} from '@/lib/infoItemReminder';

export interface FolderReminderSettingsPayload {
    name: string;
    reminder_interval_days: number;
}

interface FolderSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: InfoItem | null;
    isSaving: boolean;
    onSave: (payload: FolderReminderSettingsPayload) => void;
}

export function FolderSettingsModal({
    isOpen,
    onClose,
    item,
    isSaving,
    onSave,
}: FolderSettingsModalProps) {
    const [name, setName] = useState('');
    const [preset, setPreset] = useState(0);
    const [customDays, setCustomDays] = useState('');

    useEffect(() => {
        if (!item) return;
        const interval = item.reminder_interval_days ?? 0;
        const inPreset = (FOLDER_REMINDER_PRESETS as readonly number[]).includes(interval);
        setName(item.name);
        setPreset(inPreset ? interval : interval > 0 ? -1 : 0);
        setCustomDays(inPreset || interval <= 0 ? '' : String(interval));
    }, [item]);

    const resolveDays = () => {
        if (preset === -1) {
            const n = parseInt(customDays, 10);
            return Number.isFinite(n) && n > 0 ? n : 0;
        }
        return preset;
    };

    const handleSubmit = () => {
        if (!name.trim()) return;
        onSave({ name: name.trim(), reminder_interval_days: resolveDays() });
    };

    return (
        <AnimatePresence>
            {isOpen && item && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => !isSaving && onClose()}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 12 }}
                        className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-[#1e293b] text-slate-200 shadow-2xl z-10 p-6"
                    >
                        {!isSaving && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-white/10"
                            >
                                <X size={18} />
                            </button>
                        )}

                        <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                            <Bell size={20} className="text-violet-400" />
                            收藏夹设置
                        </h2>
                        <p className="text-xs text-slate-500 font-mono mb-5">Folder · {item.name}</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                                    名称
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={isSaving}
                                    className="w-full px-3 py-2.5 rounded-lg border border-slate-600 bg-slate-900/80 text-sm outline-none focus:border-violet-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                                    固定回顾提醒
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {FOLDER_REMINDER_PRESETS.map((days) => (
                                        <button
                                            key={days}
                                            type="button"
                                            disabled={isSaving}
                                            onClick={() => {
                                                setPreset(days);
                                                setCustomDays('');
                                            }}
                                            className={`py-2 rounded-lg border text-xs font-bold transition-colors ${
                                                preset === days
                                                    ? 'bg-violet-600/25 border-violet-500 text-violet-200'
                                                    : 'border-slate-600 text-slate-400 hover:border-slate-500'
                                            }`}
                                        >
                                            {formatFolderReminderInterval(days)}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => setPreset(-1)}
                                    className={`w-full mt-2 py-2 rounded-lg border text-xs font-bold ${
                                        preset === -1
                                            ? 'bg-violet-600/25 border-violet-500 text-violet-200'
                                            : 'border-slate-600 text-slate-400'
                                    }`}
                                >
                                    自定义天数
                                </button>
                                {preset === -1 && (
                                    <input
                                        type="number"
                                        min={1}
                                        value={customDays}
                                        onChange={(e) => setCustomDays(e.target.value)}
                                        disabled={isSaving}
                                        placeholder="例如 21"
                                        className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-600 bg-slate-900/80 text-sm font-mono"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:bg-white/5"
                            >
                                取消
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSaving || !name.trim()}
                                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
                            >
                                {isSaving && <Loader2 size={14} className="animate-spin" />}
                                保存
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
