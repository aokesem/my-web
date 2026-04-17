import React, { useCallback } from 'react';

/**
 * Handle Ctrl+B bold shortcut in textareas
 */
export const handleBoldShortcutUtil = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    setTempContent: (val: string) => void
) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        const textarea = e.currentTarget;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selected = text.substring(start, end);

        let newText: string;
        let newStart: number;
        let newEnd: number;

        // Check if selected text is already wrapped in **
        if (start >= 2 && end <= text.length - 2 && text.substring(start - 2, start) === '**' && text.substring(end, end + 2) === '**') {
            newText = text.substring(0, start - 2) + selected + text.substring(end + 2);
            newStart = start - 2;
            newEnd = end - 2;
        } else if (selected.startsWith('**') && selected.endsWith('**') && selected.length >= 4) {
            newText = text.substring(0, start) + selected.slice(2, -2) + text.substring(end);
            newStart = start;
            newEnd = end - 4;
        } else {
            newText = text.substring(0, start) + '**' + selected + '**' + text.substring(end);
            newStart = start + 2;
            newEnd = end + 2;
        }

        setTempContent(newText);
        // Restore cursor position
        requestAnimationFrame(() => {
            textarea.selectionStart = newStart;
            textarea.selectionEnd = newEnd;
        });
    }
};

/**
 * Render text with **bold** parts
 */
export const renderBoldTextUtil = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-extrabold text-stone-900">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
    });
};
