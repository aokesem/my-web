import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { useEditor, EditorContent, EditorContext, Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Markdown } from 'tiptap-markdown';
import { SlashCommand, suggestionOptions } from './slash-command';
import { MathExtension } from '@aarkue/tiptap-math-extension';
import { supabase } from '@/lib/supabaseClient';
import { compressImage } from '@/lib/imageUtils';
import { toast } from 'sonner';
import 'tippy.js/dist/tippy.css';
import 'katex/dist/katex.min.css';

// Helper: extract Supabase storage path from a public URL
function extractStoragePath(url: string, bucket: string): string | null {
    try {
        // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
        const marker = `/storage/v1/object/public/${bucket}/`;
        const idx = url.indexOf(marker);
        if (idx === -1) return null;
        return url.substring(idx + marker.length);
    } catch {
        return null;
    }
}

// Helper: delete an image from Supabase storage
async function deleteImageFromStorage(url: string, bucket: string) {
    const path = extractStoragePath(url, bucket);
    if (!path) return;
    try {
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) console.error('Storage delete error:', error);
    } catch (e) {
        console.error('Failed to delete from storage:', e);
    }
}

// Custom Heading extension that generates id attributes from text content
const HeadingWithId = Heading.extend({
    renderHTML({ node, HTMLAttributes }) {
        const level = node.attrs.level as number;
        const text = node.textContent || '';
        const id = 'heading-' + text.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/(^-|-$)/g, '');
        return [`h${level}`, { ...HTMLAttributes, id }, 0];
    },
});

export interface BlockEditorProps {
    value?: string | Record<string, any>;
    onChange?: (json: Record<string, any>) => void;
    onSave?: () => void;
    editable?: boolean;
    placeholder?: string;
    className?: string;
    imageBucket?: string;
    imageFolder?: string;
}

export interface BlockEditorRef {
    editor: Editor | null;
}

export const BlockEditor = forwardRef<BlockEditorRef, BlockEditorProps>(({
    value = '',
    onChange,
    onSave,
    editable = true,
    placeholder = '按下 / 调出菜单...',
    className = '',
    imageBucket = 'course_images',
    imageFolder = 'notes',
}, ref) => {

    // Helper: upload image to Supabase storage
    const uploadImage = async (file: File): Promise<string | null> => {
        try {
            const processedFile = await compressImage(file);
            const fileExt = processedFile.name.split('.').pop() || 'webp';
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${imageFolder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(imageBucket)
                .upload(filePath, processedFile);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from(imageBucket).getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Image upload failed:', error);
            return null;
        }
    };

    // Helper to safely parse JSON or treat as Markdown
    const parseInitialContent = (val: string | Record<string, any>) => {
        if (typeof val === 'string') {
            if (val.trim().startsWith('{')) {
                try {
                    return JSON.parse(val);
                } catch (e) {
                    return val; // Invalid JSON, treat as markdown
                }
            }
            return val; // Markdown
        }
        return val; // JSON object
    };

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: false, // Disabled: using HeadingWithId instead
            }),
            HeadingWithId.configure({
                levels: [1, 2, 3, 4, 5, 6],
            }),
            Image.configure({
                inline: false,
                allowBase64: false,
                HTMLAttributes: {
                    class: 'rounded-lg max-w-full mx-auto my-4 shadow-sm',
                },
            }),
            Markdown,
            Placeholder.configure({
                placeholder: placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
            SlashCommand.configure({
                suggestion: suggestionOptions,
            }),
            MathExtension.configure({ 
                evaluation: false, 
                katexOptions: { macros: { "\\R": "\\mathbb{R}" } } 
            }),
        ],
        content: parseInitialContent(value),
        editable: editable,
        editorProps: {
            attributes: {
                class: 'prose prose-stone prose-p:leading-relaxed prose-pre:bg-stone-100 prose-pre:text-stone-800 max-w-none text-[15px] focus:outline-none focus:ring-0 w-full min-h-[100px]',
            },
            handleKeyDown: (view, event) => {
                // Ctrl/Cmd + Enter => save
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                    if (onSave) { onSave(); return true; }
                }
                // Ctrl/Cmd + S => save
                if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                    if (onSave) { event.preventDefault(); onSave(); return true; }
                }
                // Backspace / Delete on image node => confirm + cleanup storage
                if (event.key === 'Backspace' || event.key === 'Delete') {
                    const { state } = view;
                    const { selection } = state;
                    // Check if a NodeSelection is on an image
                    if (selection instanceof NodeSelection && selection.node.type.name === 'image') {
                        const src = selection.node.attrs.src;
                        if (!window.confirm('确定删除此图片？删除后无法恢复。')) {
                            return true; // Block the delete
                        }
                        // Delete from storage
                        if (src) deleteImageFromStorage(src, imageBucket);
                        return false; // Allow Tiptap to delete the node
                    }
                    // Check node before cursor (for Backspace)
                    if (event.key === 'Backspace') {
                        const pos = selection.$from.pos;
                        if (pos > 0) {
                            const nodeBefore = state.doc.resolve(pos).nodeBefore;
                            if (nodeBefore && nodeBefore.type.name === 'image') {
                                const src = nodeBefore.attrs.src;
                                if (!window.confirm('确定删除此图片？删除后无法恢复。')) {
                                    return true;
                                }
                                if (src) deleteImageFromStorage(src, imageBucket);
                                return false;
                            }
                        }
                    }
                    // Check node after cursor (for Delete)
                    if (event.key === 'Delete') {
                        const pos = selection.$from.pos;
                        const nodeAfter = state.doc.resolve(pos).nodeAfter;
                        if (nodeAfter && nodeAfter.type.name === 'image') {
                            const src = nodeAfter.attrs.src;
                            if (!window.confirm('确定删除此图片？删除后无法恢复。')) {
                                return true;
                            }
                            if (src) deleteImageFromStorage(src, imageBucket);
                            return false;
                        }
                    }
                }
                return false;
            },
            handlePaste: (view, event) => {
                const items = event.clipboardData?.items;
                if (!items) return false;
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        if (file) {
                            event.preventDefault();
                            uploadImage(file).then(url => {
                                if (url && editor) {
                                    editor.chain().focus().setImage({ src: url }).run();
                                }
                            });
                            return true;
                        }
                    }
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            if (onChange) {
                // Return JSON back to parent
                onChange(editor.getJSON());
            }
        },
    });

    useImperativeHandle(ref, () => ({
        editor: editor
    }), [editor]);

    // Update editable state dynamically if needed
    useEffect(() => {
        if (editor && editor.isEditable !== editable) {
            editor.setEditable(editable);
        }
    }, [editable, editor]);

    // Handle external value changes (only if editor content is deeply different)
    useEffect(() => {
        if (!editor || value === undefined) return;

        // This is a naive way to prevent infinite loops when onChange -> parent updates value -> child updates editor
        // In a real robust system, we compare JSON deeper or rely on Tiptap's internal transaction ID
        // For now, if value is a string and it's not JSON, we set it.
        if (typeof value === 'string' && !value.trim().startsWith('{')) {
            // Only update if it's external Markdown loading
            // Actually, we shouldn't rely on this after initialization if working primarily in JSON.
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className={`block-editor-wrapper relative ${className}`}>
            <style dangerouslySetInnerHTML={{
                __html: `
                /* Placeholder styles */
                .is-editor-empty:first-child::before {
                    color: #a8a29e;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
            `}} />
            <EditorContent editor={editor} />
        </div>
    );
});
BlockEditor.displayName = 'BlockEditor';
