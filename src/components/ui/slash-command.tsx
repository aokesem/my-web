import { Extension } from '@tiptap/core';
import Suggestion, { SuggestionOptions } from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Minus, ImageIcon } from 'lucide-react';

export interface CommandItemProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    command: ({ editor, range }: { editor: any, range: any }) => void;
}

export interface SuggestionProps {
    query: string;
    imageBucket?: string;
    imageFolder?: string;
}

const getSuggestionItems = ({ query, imageBucket, imageFolder }: SuggestionProps): CommandItemProps[] => {
    return [
        {
            title: '一级标题',
            description: '大号段落标题',
            icon: <Heading1 size={18} />,
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
            },
        },
        {
            title: '二级标题',
            description: '中号段落标题',
            icon: <Heading2 size={18} />,
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
            },
        },
        {
            title: '三级标题',
            description: '小号段落标题',
            icon: <Heading3 size={18} />,
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
            },
        },
        {
            title: '无序列表',
            description: '创建一个简单的项目符号列表',
            icon: <List size={18} />,
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
            },
        },
        {
            title: '有序列表',
            description: '创建一个带有数字的列表',
            icon: <ListOrdered size={18} />,
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
            },
        },
        {
            title: '引用块',
            description: '捕捉一段引用文字',
            icon: <Quote size={18} />,
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run();
            },
        },
        {
            title: '代码块',
            description: '插入代码片段',
            icon: <Code size={18} />,
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
            },
        },
        {
            title: '分割线',
            description: '插入一条水平分割线',
            icon: <Minus size={18} />,
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).setHorizontalRule().run();
            },
        },
        {
            title: '插入图片',
            description: '上传或粘贴一张图片',
            icon: <ImageIcon size={18} />,
            command: ({ editor, range }: { editor: any, range: any }) => {
                editor.chain().focus().deleteRange(range).run();
                // Trigger file input
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    // Use the uploadImage method from BlockEditor via paste handler pattern
                    // For simplicity, directly import and call
                    const { compressImage } = await import('@/lib/imageUtils');
                    const { supabase } = await import('@/lib/supabaseClient');
                    try {
                        const bucket = imageBucket || 'course_images'; // default fallback
                        const folder = imageFolder || 'notes';
                        const processedFile = await compressImage(file);
                        const fileExt = processedFile.name.split('.').pop() || 'webp';
                        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
                        const filePath = `${folder}/${fileName}`;
                        const { error } = await supabase.storage.from(bucket).upload(filePath, processedFile);
                        if (error) throw error;
                        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
                        editor.chain().focus().setImage({ src: data.publicUrl }).run();
                    } catch (err) {
                        console.error('Image upload failed:', err);
                    }
                };
                input.click();
            },
        },
    ].filter(item => item.title.toLowerCase().includes(query.toLowerCase()) || item.description.includes(query));
};

export const CommandList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
                return true;
            }
            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }
            if (event.key === 'Enter') {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    return (
        <div className="bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden flex flex-col p-1.5 w-72">
            {props.items.length > 0 ? (
                props.items.map((item: CommandItemProps, index: number) => (
                    <button
                        key={index}
                        onClick={() => selectItem(index)}
                        className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                            index === selectedIndex ? 'bg-stone-100 text-stone-900' : 'bg-transparent text-stone-700 hover:bg-stone-50'
                        }`}
                    >
                        <div className="flex bg-white border border-stone-200 rounded-md p-1.5 shadow-sm text-stone-600">
                            {item.icon}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-stone-800">{item.title}</p>
                            <p className="text-[11px] text-stone-500">{item.description}</p>
                        </div>
                    </button>
                ))
            ) : (
                <div className="p-3 text-stone-500 text-sm text-center">无结果</div>
            )}
        </div>
    );
});
CommandList.displayName = 'CommandList';

export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range });
                },
            } as Omit<SuggestionOptions, 'editor'>,
            imageBucket: 'course_images',
            imageFolder: 'notes',
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});

export const suggestionOptions = {
    items: ({ query, editor }: any) => {
        // extract options from the extension
        const ext = editor.extensionManager.extensions.find((e: any) => e.name === 'slashCommand');
        const imageBucket = ext?.options?.imageBucket;
        const imageFolder = ext?.options?.imageFolder;
        return getSuggestionItems({ query, imageBucket, imageFolder });
    },
    render: () => {
        let component: ReactRenderer;
        let popup: TippyInstance | TippyInstance[];

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(CommandList, {
                    props,
                    editor: props.editor,
                });

                if (!props.clientRect) {
                    return;
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },

            onUpdate(props: any) {
                component.updateProps(props);

                if (!props.clientRect) {
                    return;
                }

                if (Array.isArray(popup)) {
                    popup[0].setProps({
                        getReferenceClientRect: props.clientRect,
                    });
                } else {
                    popup.setProps({
                        getReferenceClientRect: props.clientRect,
                    });
                }
            },

            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    if (Array.isArray(popup)) {
                        popup[0].hide();
                    } else {
                        popup.hide();
                    }
                    return true;
                }

                return (component.ref as any)?.onKeyDown(props);
            },

            onExit() {
                if (Array.isArray(popup)) {
                    popup[0].destroy();
                } else {
                    popup.destroy();
                }
                component.destroy();
            },
        };
    },
};
