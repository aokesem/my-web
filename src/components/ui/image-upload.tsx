"use client";

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { compressImage } from '@/lib/imageUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Image as ImageIcon, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    bucket: string;
    folder: string; // e.g., "books", "anime"
    className?: string;
    autoFocus?: boolean;
}

export function ImageUpload({ value, onChange, bucket, folder, className, autoFocus }: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (autoFocus && !value && containerRef.current) {
            containerRef.current.focus();
        }
    }, [autoFocus, value]);

    const uploadFile = async (file: File) => {
        try {
            setUploading(true);

            // 自动压缩图片 (Resize + WebP)
            const processedFile = await compressImage(file);

            const fileExt = processedFile.name.split('.').pop() || 'webp';
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, processedFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
            setUploadedFiles(prev => [...prev, data.publicUrl]);
            onChange(data.publicUrl);
            toast.success('Image uploaded successfully');
        } catch (error: any) {
            toast.error('Error uploading image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) await uploadFile(file);
    };

    const handlePaste = async (event: React.ClipboardEvent) => {
        const items = event.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    await uploadFile(file);
                    break;
                }
            }
        }
    };

    const handleRemoveClick = () => {
        if (!value) return;
        setShowConfirm(true);
    };

    const handleConfirmRemove = async () => {
        if (!value) return;
        
        try {
            setDeleting(true);

            // 解析 filePath: value 通常是 .../bucket_name/folder_name/uuid.webp
            const urlParts = value.split(`/${bucket}/`);
            if (urlParts.length > 1) {
                const filePath = urlParts[1];
                const { error } = await supabase.storage.from(bucket).remove([filePath]);
                if (error) throw error;
                
                toast.success('已从云端永久删除图片');
            }
        } catch (error: any) {
            toast.error('清理云端图片失败: ' + error.message);
        } finally {
            setDeleting(false);
            setShowConfirm(false);
            onChange(''); // 无论云端是否成功删除，前端都清空预览
        }
    };

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            onPaste={handlePaste}
            className={`flex flex-col gap-4 focus:outline-hidden group ${className}`}
        >
            {value ? (
                <div className="relative w-40 h-56 rounded-md overflow-hidden border border-zinc-800 group">
                    <img src={value} alt="Cover" className="object-cover w-full h-full" />
                    <div className="absolute top-2 right-2">
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6 rounded-full opacity-80 hover:opacity-100"
                            onClick={handleRemoveClick}
                        >
                            <X size={14} />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center w-full">
                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-800 border-dashed rounded-lg bg-zinc-950/50 hover:bg-zinc-900 focus-within:border-blue-500 focus-within:bg-zinc-900 transition-all cursor-default">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploading ? (
                                <>
                                    <Loader2 className="w-8 h-8 mb-3 text-zinc-500 animate-spin" />
                                    <p className="text-sm text-zinc-500">Uploading...</p>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-8 h-8 mb-3 text-zinc-500" />
                                    <p className="text-sm text-zinc-500">Paste here or</p>
                                    <label className="text-sm text-blue-500 hover:text-blue-400 font-medium cursor-pointer underline underline-offset-4 mt-1">
                                        Browse files
                                        <Input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 确认删除对话框 */}
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="bg-zinc-950 border-zinc-800 text-gray-100 sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-500">
                            <AlertTriangle size={20} />
                            彻底删除云端图片？
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 pt-2">
                            {value && uploadedFiles.includes(value) 
                                ? "这是你刚刚上传的草稿图片，取消保留将会从服务器永久物理清除。" 
                                : "【高危警告】这似乎是一张正被使用的旧图片。一旦在此删除，服务器上的文件会立刻消失。无论随后你是否保存表单，它都无法找回！"}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-6 flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowConfirm(false)}
                            disabled={deleting}
                            className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                        >
                            取消
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmRemove}
                            disabled={deleting}
                            className="bg-rose-600 hover:bg-rose-700 text-white min-w-[100px]"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin mr-2" />
                                    删除中...
                                </>
                            ) : (
                                <>
                                    <Trash2 size={16} className="mr-2" />
                                    确认永久删除
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
