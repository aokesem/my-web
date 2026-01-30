"use client";

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (autoFocus && !value && containerRef.current) {
            containerRef.current.focus();
        }
    }, [autoFocus, value]);

    const uploadFile = async (file: File) => {
        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop() || 'png';
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${folder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
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

    const handleRemove = () => {
        onChange('');
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
                            onClick={handleRemove}
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
        </div>
    );
}
