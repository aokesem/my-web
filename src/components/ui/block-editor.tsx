import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent, EditorContext } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { SlashCommand, suggestionOptions } from './slash-command';
import { MathExtension } from '@aarkue/tiptap-math-extension';
import 'tippy.js/dist/tippy.css';
import 'katex/dist/katex.min.css';

export interface BlockEditorProps {
    value?: string | Record<string, any>;
    onChange?: (json: Record<string, any>) => void;
    onSave?: () => void;
    editable?: boolean;
    placeholder?: string;
    className?: string;
}

export function BlockEditor({
    value = '',
    onChange,
    onSave,
    editable = true,
    placeholder = '按下 / 调出菜单...',
    className = ''
}: BlockEditorProps) {

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
            StarterKit,
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
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                    if (onSave) {
                        onSave();
                        return true;
                    }
                }
                return false;
            }
        },
        onUpdate: ({ editor }) => {
            if (onChange) {
                // Return JSON back to parent
                onChange(editor.getJSON());
            }
        },
    });

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
}
