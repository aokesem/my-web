"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Film, Check, RotateCcw } from 'lucide-react';

interface StillEditorProps {
    url: string;
    initialPos?: string;
    isOpen: boolean;
    onClose: () => void;
    onSave: (position: string) => void;
}

export default function StillEditor({ url, initialPos = '50%', isOpen, onClose, onSave }: StillEditorProps) {
    // 提取垂直偏移百分比，例如 "center 20%" -> 20
    const extractY = (posStr: string) => {
        const match = posStr.match(/(\d+)%/);
        return match ? parseInt(match[1], 10) : 50;
    };

    const [posY, setPosY] = useState(extractY(initialPos));

    useEffect(() => {
        if (isOpen) {
            setPosY(extractY(initialPos));
        }
    }, [isOpen, initialPos]);

    const handleReset = () => setPosY(50);

    const handleApply = () => {
        onSave(`center ${posY}%`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-gray-100 max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Film size={18} className="text-blue-500" />
                        调整剧照焦点区域
                    </DialogTitle>
                </DialogHeader>

                <div className="py-6 space-y-8">
                    {/* 预览区域：模拟 /cinema 页面的超宽屏比例 (约 3.4:1) */}
                    <div className="space-y-2">
                        <Label className="text-zinc-400 text-xs uppercase tracking-widest">
                            Cinema_Ratio_Preview (3.4:1)
                        </Label>
                        <div className="w-full aspect-[3.4/1] bg-black rounded-xl overflow-hidden border border-white/10 relative shadow-2xl">
                            <img
                                src={url}
                                alt="Focus Preview"
                                className="w-full h-full object-cover transition-all duration-300"
                                style={{ objectPosition: `center ${posY}%` }}
                            />
                            {/* 辅助线 */}
                            <div className="absolute inset-0 pointer-events-none border border-blue-500/20" />
                            <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-500/10 pointer-events-none" />
                        </div>
                    </div>

                    {/* 控制滑块 */}
                    <div className="space-y-4 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                        <div className="flex justify-between items-end mb-2">
                            <Label className="text-sm font-medium text-gray-300">垂直偏移 (Vertical Offset)</Label>
                            <span className="font-mono text-blue-500 text-lg font-bold">{posY}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={posY}
                            onChange={(e) => setPosY(parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                        />
                        <div className="flex justify-between text-[10px] text-zinc-600 font-mono uppercase tracking-tighter pt-1">
                            <span>Top (0%)</span>
                            <span>Center (50%)</span>
                            <span>Bottom (100%)</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                        className="text-zinc-500 hover:text-white hover:bg-zinc-900 gap-2 border border-zinc-900"
                    >
                        <RotateCcw size={14} /> 重置居中
                    </Button>
                    <div className="flex-1" />
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-zinc-800 bg-transparent hover:bg-zinc-900 text-gray-400"
                    >
                        取消
                    </Button>
                    <Button
                        onClick={handleApply}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6"
                    >
                        <Check size={16} /> 保存焦点参数
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
