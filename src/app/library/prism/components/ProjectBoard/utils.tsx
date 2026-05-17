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

/** 议程条目正文展示（支持 **加粗**） */
export function AgendaContentDisplay({
    content,
    displayRef,
    emptyLabel = '（暂无正文）',
}: {
    content: string;
    displayRef?: React.RefObject<HTMLDivElement | null>;
    emptyLabel?: string;
}) {
    return (
        <div
            ref={displayRef}
            className="text-base text-stone-700 leading-relaxed whitespace-pre-wrap min-h-[2.5rem]"
        >
            {content?.trim() ? renderBoldTextUtil(content) : <span className="text-stone-400 text-sm">{emptyLabel}</span>}
        </div>
    );
}

/** 编辑时按展示高度起跳，并随内容增高；支持 Ctrl+B */
export function AgendaContentTextarea({
    value,
    onChange,
    disabled,
    minHeightPx,
    placeholder = '支持 Ctrl+B 加粗',
    ringClass = 'focus:ring-violet-200',
}: {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    minHeightPx?: number;
    placeholder?: string;
    ringClass?: string;
}) {
    const ref = React.useRef<HTMLTextAreaElement>(null);

    const syncHeight = React.useCallback(() => {
        const el = ref.current;
        if (!el) return;
        el.style.height = 'auto';
        const h = Math.max(el.scrollHeight + 2, minHeightPx ?? 40);
        el.style.height = `${h}px`;
    }, [value, minHeightPx]);

    React.useLayoutEffect(() => {
        syncHeight();
    }, [syncHeight]);

    return (
        <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => handleBoldShortcutUtil(e, onChange)}
            disabled={disabled}
            rows={1}
            placeholder={placeholder}
            className={`w-full resize-none overflow-hidden rounded-lg border border-stone-200 bg-white p-3 text-base text-stone-700 leading-relaxed outline-none focus:ring-1 ${ringClass}`}
        />
    );
}
