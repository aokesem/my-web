"use client";

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { supaSafeDelete } from '@/lib/databaseUtils';
import { toast } from 'sonner';

interface SafeDeleteDialogProps {
    table: string;
    recordId: number | string;
    imageFields?: string[];
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    onSuccess?: () => void;
    children: React.ReactNode; // 触发器按钮
}

export function SafeDeleteDialog({
    table,
    recordId,
    imageFields = [],
    title = "确定要执行删除吗？",
    description = "此操作不可撤销。数据库记录将被永久移除，且相关的存储文件也将被同步清理。",
    confirmText = "确认删除",
    cancelText = "取消",
    onSuccess,
    children
}: SafeDeleteDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const result = await supaSafeDelete({
                table,
                id: recordId,
                imageFields
            });

            if (result.success) {
                toast.success('删除成功并已在后台排队清理关联文件');
                setIsOpen(false);
                if (onSuccess) onSuccess();
            } else {
                toast.error(`删除失败: ${result.error}`);
            }
        } catch (error: any) {
            toast.error(`意外错误: ${error.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {/* 样式由包裹的 children 决定 */}
                {children}
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-gray-100 sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-rose-500">
                        <AlertTriangle size={20} />
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400 pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-6 flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isDeleting}
                        className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-rose-600 hover:bg-rose-700 text-white min-w-[100px]"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 size={16} className="animate-spin mr-2" />
                                处理中...
                            </>
                        ) : (
                            <>
                                <Trash2 size={16} className="mr-2" />
                                {confirmText}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
