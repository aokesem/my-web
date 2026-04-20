import JSZip from 'jszip';
import { supabase } from './supabaseClient';

/**
 * 轻量级 Tiptap JSON 转 Markdown 转换器
 * 用于在导出的 JSON 中提供可读的预览
 */
export function tiptapToMarkdown(json: any): string {
    if (!json || !json.content) return '';

    let markdown = '';

    const traverse = (nodes: any[]) => {
        nodes.forEach(node => {
            switch (node.type) {
                case 'heading':
                    markdown += '#'.repeat(node.attrs?.level || 1) + ' ' + (node.content?.[0]?.text || '') + '\n\n';
                    break;
                case 'paragraph':
                    if (node.content) {
                        node.content.forEach((c: any) => {
                            if (c.type === 'text') markdown += c.text;
                            else if (c.type === 'hardBreak') markdown += '\n';
                        });
                    }
                    markdown += '\n\n';
                    break;
                case 'bulletList':
                    node.content?.forEach((item: any) => {
                        markdown += '- ' + (item.content?.[0]?.content?.[0]?.text || '') + '\n';
                    });
                    markdown += '\n';
                    break;
                case 'codeBlock':
                    markdown += '```' + (node.attrs?.language || '') + '\n' + (node.content?.[0]?.text || '') + '\n```\n\n';
                    break;
                case 'image':
                    markdown += `![Image](${node.attrs?.src})\n\n`;
                    break;
                case 'horizontalRule':
                    markdown += '---\n\n';
                    break;
                default:
                    if (node.content) traverse(node.content);
            }
        });
    };

    traverse(json.content);
    return markdown.trim();
}

/**
 * 导出课程为 ZIP
 */
export async function exportCourseToZip(course: any) {
    const zip = new JSZip();

    // 1. 获取所有章节
    const { data: chapters, error: chError } = await supabase
        .from('prism_course_chapters')
        .select('*')
        .eq('course_id', course.id)
        .order('sort_order');

    if (chError) throw chError;

    // 2. 获取所有公式
    const { data: formulas, error: fError } = await supabase
        .from('prism_course_formulas')
        .select('*')
        .eq('course_id', course.id)
        .order('sort_order');

    if (fError) throw fError;

    // 3. 生成 manifest.json (元数据)
    const manifest = {
        name: course.name,
        name_en: course.name_en,
        description: course.description,
        icon: course.icon,
        color: course.color,
        export_date: new Date().toISOString(),
        version: "1.0"
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

    // 4. 打包章节
    const chaptersFolder = zip.folder("chapters");
    if (chaptersFolder) {
        for (const ch of (chapters || [])) {
            let mdPreview = '';
            try {
                if (ch.notes) mdPreview = tiptapToMarkdown(JSON.parse(ch.notes));
            } catch (e) {
                console.warn(`Failed to parse notes for chapter: ${ch.title}`);
            }

            const chapterData = {
                title: ch.title,
                notes_json: ch.notes,
                notes_md: mdPreview,
                formulas: (formulas || [])
                    .filter(f => f.chapter_id === ch.id)
                    .map(f => ({
                        name: f.name,
                        latex: f.latex,
                        description: f.description,
                        sort_order: f.sort_order
                    })),
                sort_order: ch.sort_order
            };

            // 文件名处理：移除非法字符
            const safeTitle = ch.title.replace(/[\\/:*?"<>|]/g, '_');
            chaptersFolder.file(`${ch.sort_order.toString().padStart(2, '0')}_${safeTitle}.json`, JSON.stringify(chapterData, null, 2));
        }
    }

    // 5. 触发下载
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Course_${course.name.replace(/\s+/g, '_')}_Backup.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * 检查章节名冲突并生成新名称
 */
async function getSafeChapterTitle(courseId: string, originalTitle: string): Promise<string> {
    const { data } = await supabase
        .from('prism_course_chapters')
        .select('title')
        .eq('course_id', courseId);
    
    const existingTitles = new Set(data?.map(c => c.title) || []);
    
    if (!existingTitles.has(originalTitle)) return originalTitle;
    
    let counter = 1;
    let newTitle = `${originalTitle}_${counter.toString().padStart(2, '0')}`;
    while (existingTitles.has(newTitle)) {
        counter++;
        newTitle = `${originalTitle}_${counter.toString().padStart(2, '0')}`;
    }
    return newTitle;
}

/**
 * 导入单个章节
 */
export async function importChapterFromJson(courseId: string, chapterData: any) {
    // 1. 确定标题 (冲突处理)
    const finalTitle = await getSafeChapterTitle(courseId, chapterData.title);

    // 2. 插入章节
    const { data: newChapter, error: chError } = await supabase
        .from('prism_course_chapters')
        .insert([{
            course_id: courseId,
            title: finalTitle,
            notes: chapterData.notes_json,
            sort_order: chapterData.sort_order
        }])
        .select()
        .single();

    if (chError) throw chError;

    // 3. 插入关联公式
    if (chapterData.formulas && chapterData.formulas.length > 0) {
        const formulasToInsert = chapterData.formulas.map((f: any) => ({
            course_id: courseId,
            chapter_id: newChapter.id,
            name: f.name,
            latex: f.latex,
            description: f.description,
            sort_order: f.sort_order
        }));
        
        const { error: fError } = await supabase
            .from('prism_course_formulas')
            .insert(formulasToInsert);
        
        if (fError) throw fError;
    }

    return finalTitle;
}
