import JSZip from 'jszip';
import { supabase } from './supabaseClient';

/**
 * 高保真 Tiptap JSON / AST 转 Markdown 转换器
 * 支持所有常见块级元素、行内 Marks（粗体、斜体、代码、删除线、链接）、GFM 表格与 LaTeX 公式
 */
export function tiptapToMarkdown(input: any): string {
    if (!input) return '';

    let json: any = input;
    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
            // 原生普通文本或已是 Markdown
            return trimmed;
        }
        try {
            json = JSON.parse(trimmed);
        } catch {
            return input;
        }
    }

    if (!json || typeof json !== 'object') return '';

    // 渲染行内节点
    const renderInlineNode = (node: any): string => {
        if (!node) return '';

        if (node.type === 'text') {
            let text = node.text || '';
            if (node.marks && Array.isArray(node.marks)) {
                // 优先应用 code，再应用 bold / italic / strike / link
                const sortedMarks = [...node.marks].sort((a, b) => {
                    if (a.type === 'code') return -1;
                    if (b.type === 'code') return 1;
                    return 0;
                });

                for (const mark of sortedMarks) {
                    switch (mark.type) {
                        case 'code':
                            text = `\`${text}\``;
                            break;
                        case 'bold':
                            text = `**${text}**`;
                            break;
                        case 'italic':
                            text = `*${text}*`;
                            break;
                        case 'strike':
                            text = `~~${text}~~`;
                            break;
                        case 'link': {
                            const href = mark.attrs?.href || '';
                            text = `[${text}](${href})`;
                            break;
                        }
                    }
                }
            }
            return text;
        }

        if (node.type === 'hardBreak') {
            return '\n';
        }

        if (node.type === 'inlineMath') {
            const latex = node.attrs?.latex || '';
            const isDisplay = node.attrs?.display === 'yes';
            return isDisplay ? `\n\n$$\n${latex}\n$$\n\n` : `$${latex}$`;
        }

        if (node.type === 'image') {
            const alt = node.attrs?.alt || 'Image';
            const src = node.attrs?.src || '';
            return `![${alt}](${src})`;
        }

        return '';
    };

    const renderInlineContent = (content?: any[]): string => {
        if (!content || !Array.isArray(content)) return '';
        return content.map(renderInlineNode).join('');
    };

    // 渲染块级节点
    const renderBlockNode = (node: any, indentLevel = 0): string => {
        if (!node) return '';

        switch (node.type) {
            case 'heading': {
                const level = Math.min(Math.max(node.attrs?.level || 1, 1), 6);
                return `${'#'.repeat(level)} ${renderInlineContent(node.content)}`;
            }

            case 'paragraph': {
                return renderInlineContent(node.content);
            }

            case 'blockquote': {
                const inner = (node.content || [])
                    .map((child: any) => renderBlockNode(child, indentLevel))
                    .filter(Boolean)
                    .join('\n\n');
                return inner
                    .split('\n')
                    .map((line: string) => `> ${line}`)
                    .join('\n');
            }

            case 'codeBlock': {
                const lang = node.attrs?.language || '';
                const code = node.content?.[0]?.text || '';
                return `\`\`\`${lang}\n${code}\n\`\`\``;
            }

            case 'bulletList': {
                return (node.content || [])
                    .map((item: any) => {
                        const itemText = (item.content || [])
                            .map((child: any) => renderBlockNode(child, indentLevel + 1))
                            .join('\n');
                        const indent = '  '.repeat(indentLevel);
                        return `${indent}- ${itemText}`;
                    })
                    .join('\n');
            }

            case 'orderedList': {
                const start = node.attrs?.start || 1;
                return (node.content || [])
                    .map((item: any, idx: number) => {
                        const itemText = (item.content || [])
                            .map((child: any) => renderBlockNode(child, indentLevel + 1))
                            .join('\n');
                        const indent = '  '.repeat(indentLevel);
                        return `${indent}${start + idx}. ${itemText}`;
                    })
                    .join('\n');
            }

            case 'horizontalRule':
                return '---';

            case 'image':
                return `![${node.attrs?.alt || 'Image'}](${node.attrs?.src || ''})`;

            case 'inlineMath': {
                const latex = node.attrs?.latex || '';
                return `$$\n${latex}\n$$`;
            }

            case 'table': {
                const rows = node.content || [];
                if (rows.length === 0) return '';

                const tableData: string[][] = [];
                for (const row of rows) {
                    const cells = row.content || [];
                    const rowData = cells.map((cell: any) => {
                        const cellText = (cell.content || [])
                            .map((p: any) => renderInlineContent(p.content))
                            .join(' ')
                            .replace(/\|/g, '\\|')
                            .trim();
                        return cellText;
                    });
                    tableData.push(rowData);
                }

                if (tableData.length === 0) return '';
                const colCount = Math.max(...tableData.map(r => r.length));
                // 补齐列
                const normalized = tableData.map(row => {
                    const r = [...row];
                    while (r.length < colCount) r.push('');
                    return r;
                });

                const headerRow = normalized[0];
                const headerLine = `| ${headerRow.join(' | ')} |`;
                const sepLine = `| ${headerRow.map(() => '---').join(' | ')} |`;
                const bodyLines = normalized.slice(1).map(r => `| ${r.join(' | ')} |`);

                return [headerLine, sepLine, ...bodyLines].join('\n');
            }

            default:
                if (node.content && Array.isArray(node.content)) {
                    return node.content
                        .map((c: any) => renderBlockNode(c, indentLevel))
                        .filter(Boolean)
                        .join('\n\n');
                }
                return '';
        }
    };

    if (json.type === 'doc' && Array.isArray(json.content)) {
        return json.content
            .map((node: any) => renderBlockNode(node, 0))
            .filter((block: string) => block !== '')
            .join('\n\n')
            .trim();
    }

    if (Array.isArray(json)) {
        return json
            .map((node: any) => renderBlockNode(node, 0))
            .filter((block: string) => block !== '')
            .join('\n\n')
            .trim();
    }

    return renderBlockNode(json, 0).trim();
}

/**
 * 导出课程为 ZIP
 */

type CourseExportRecord = {
    id: string;
    name: string;
    name_en?: string | null;
    description?: string | null;
    icon?: string | null;
    color?: string | null;
};

function safeArchiveName(value: string | undefined | null, fallback = 'untitled') {
    return (value || fallback).replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
}

async function writeCourseBackup(folder: JSZip, course: CourseExportRecord) {
    const { data: chapters, error: chError } = await supabase
        .from('prism_course_chapters')
        .select('*')
        .eq('course_id', course.id)
        .order('sort_order');

    if (chError) throw chError;

    const { data: formulas, error: fError } = await supabase
        .from('prism_course_formulas')
        .select('*')
        .eq('course_id', course.id)
        .order('sort_order');

    if (fError) throw fError;

    const manifest = {
        name: course.name,
        name_en: course.name_en,
        description: course.description,
        icon: course.icon,
        color: course.color,
        export_date: new Date().toISOString(),
        version: '1.0'
    };
    folder.file('manifest.json', JSON.stringify(manifest, null, 2));

    const chaptersFolder = folder.folder('chapters');
    const markdownFolder = folder.folder('markdown');
    if (!chaptersFolder || !markdownFolder) return;

    const chapterListForReadme: { index: number; title: string; filename: string }[] = [];

    for (const ch of (chapters || [])) {
        let mdPreview = '';
        try {
            mdPreview = tiptapToMarkdown(ch.notes);
        } catch (e) {
            console.warn(`Failed to parse notes for chapter: ${ch.title}`);
        }

        const chapterFormulas = (formulas || [])
            .filter(f => f.chapter_id === ch.id)
            .sort((a, b) => a.sort_order - b.sort_order);

        const chapterData = {
            title: ch.title,
            notes_json: ch.notes,
            notes_md: mdPreview,
            formulas: chapterFormulas.map(f => ({
                name: f.name,
                latex: f.latex,
                description: f.description,
                sort_order: f.sort_order
            })),
            sort_order: ch.sort_order
        };

        const baseFileName = `${ch.sort_order.toString().padStart(2, '0')}_${safeArchiveName(ch.title)}`;

        // 1. 保留结构化 JSON 数据（存入 chapters/ 目录，用于系统备份与恢复）
        chaptersFolder.file(
            `${baseFileName}.json`,
            JSON.stringify(chapterData, null, 2)
        );

        // 2. 构造可直接阅读的 Markdown 章节文件（存入独立的 markdown/ 目录）
        let chapterMd = `# ${ch.title}\n\n`;
        chapterMd += `${mdPreview || '*（本章暂无详细笔记内容）*'}\n\n`;

        if (chapterFormulas.length > 0) {
            chapterMd += `---\n\n## 核心公式与推导\n\n`;
            chapterMd += chapterFormulas
                .map((f, i) => {
                    let fBlock = `### ${i + 1}. ${f.name || '未命名公式'}\n\n`;
                    if (f.description) {
                        fBlock += `> ${f.description}\n\n`;
                    }
                    fBlock += `$$\n${f.latex || ''}\n$$`;
                    return fBlock;
                })
                .join('\n\n');
            chapterMd += '\n';
        }

        markdownFolder.file(`${baseFileName}.md`, chapterMd);

        chapterListForReadme.push({
            index: ch.sort_order,
            title: ch.title,
            filename: `${baseFileName}.md`
        });
    }

    // 3. 生成课程总导览 README.md
    let courseReadme = `# ${course.name}`;
    if (course.name_en) courseReadme += ` (${course.name_en})`;
    courseReadme += '\n\n';

    if (course.description) {
        courseReadme += `> ${course.description}\n\n`;
    }

    courseReadme += `*导出时间：${new Date().toLocaleString('zh-CN')} | 章节总数：${chapters?.length || 0}*\n\n`;
    courseReadme += `## 章节目录索引\n\n`;

    if (chapterListForReadme.length > 0) {
        chapterListForReadme.forEach((item, idx) => {
            courseReadme += `${idx + 1}. [${item.title}](./markdown/${item.filename})\n`;
        });
        courseReadme += '\n';
    } else {
        courseReadme += `*暂无章节记录*\n\n`;
    }

    // 检查是否存在未关联具体章节的全局公式
    const unassignedFormulas = (formulas || []).filter(f => !f.chapter_id);
    if (unassignedFormulas.length > 0) {
        courseReadme += `---\n\n## 全局/通用公式\n\n`;
        courseReadme += unassignedFormulas
            .map((f, i) => {
                let fBlock = `### ${i + 1}. ${f.name || '通用公式'}\n\n`;
                if (f.description) {
                    fBlock += `> ${f.description}\n\n`;
                }
                fBlock += `$$\n${f.latex || ''}\n$$`;
                return fBlock;
            })
            .join('\n\n');
        courseReadme += '\n';
    }

    folder.file('README.md', courseReadme);
}

/**
 * 导出单门课程为 ZIP。
 */
export async function exportCourseToZip(course: CourseExportRecord) {
    const zip = new JSZip();
    await writeCourseBackup(zip, course);

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Course_${safeArchiveName(course.name)}_Backup.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * 导出全部课程为一个总 ZIP。每门课程仍保留单课备份结构，方便拆分导入。
 */
export async function exportAllCoursesToZip(courses: CourseExportRecord[]) {
    const zip = new JSZip();
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 16).replace('T', '_');

    zip.file('manifest.json', JSON.stringify({
        type: 'prism_courses_backup',
        version: '1.0',
        export_date: now.toISOString(),
        course_count: courses.length
    }, null, 2));

    const coursesFolder = zip.folder('courses');
    if (!coursesFolder) return;

    for (const [index, course] of courses.entries()) {
        const courseFolder = coursesFolder.folder(`${String(index + 1).padStart(2, '0')}_${safeArchiveName(course.name)}`);
        if (courseFolder) await writeCourseBackup(courseFolder, course);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Prism_Courses_Full_Backup_${timestamp}.zip`;
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
    // 1. 基础合法性校验
    if (!chapterData || !chapterData.title) {
        throw new Error("导入失败：JSON 文件缺少标题字段");
    }

    // 2. 确定标题 (冲突处理：同名则加后缀)
    const finalTitle = await getSafeChapterTitle(courseId, chapterData.title);

    // 3. 计算追加排序 (获取当前最大排序号并 +1)
    const { data: countData } = await supabase
        .from('prism_course_chapters')
        .select('sort_order')
        .eq('course_id', courseId)
        .order('sort_order', { ascending: false })
        .limit(1);
    
    const nextSortOrder = countData && countData.length > 0 
        ? countData[0].sort_order + 1 
        : 0;

    // 4. 插入章节
    const { data: newChapter, error: chError } = await supabase
        .from('prism_course_chapters')
        .insert([{
            course_id: courseId,
            title: finalTitle,
            notes: chapterData.notes_json || null,
            sort_order: nextSortOrder
        }])
        .select()
        .single();

    if (chError) throw chError;

    // 5. 插入关联公式 (带回退机制)
    try {
        if (chapterData.formulas && chapterData.formulas.length > 0) {
            const formulasToInsert = chapterData.formulas.map((f: any, idx: number) => ({
                course_id: courseId,
                chapter_id: newChapter.id,
                name: f.name || "未命名公式",
                latex: f.latex || "",
                description: f.description,
                sort_order: idx // 公式内部排序重置为 0, 1, 2...
            }));
            
            const { error: fError } = await supabase
                .from('prism_course_formulas')
                .insert(formulasToInsert);
            
            if (fError) throw fError;
        }
    } catch (err: any) {
        // 如果公式插入失败，尝试回退（删除刚刚创建的章节）
        console.error("Formula import failed, rolling back chapter...", err);
        await supabase.from('prism_course_chapters').delete().eq('id', newChapter.id);
        throw new Error(`公式导入失败，已回退章节创建: ${err.message}`);
    }

    return finalTitle;
}

// ============================================================
// PAPER MODULE IO
// ============================================================

/**
 * 辅助：根据 ID 列表获取字典名称
 */
async function getNamesByIds(table: string, ids: string[]): Promise<string[]> {
    if (!ids || ids.length === 0) return [];
    const { data } = await supabase.from(table).select('name').in('id', ids);
    return data?.map(d => d.name) || [];
}

/**
 * 辅助：根据名称获取或创建字典 ID
 */
async function getOrCreateDictId(table: string, name: string): Promise<string> {
    const { data: existing } = await supabase.from(table).select('id').eq('name', name).maybeSingle();
    if (existing) return existing.id;

    const { data: created, error } = await supabase
        .from(table)
        .insert([{ name, sort_order: 0 }])
        .select()
        .single();
    
    if (error) throw error;
    return created.id;
}

/**
 * 写入论文库备份内容到指定文件夹
 */
async function writePapersBackup(papersFolder: JSZip, papers: any[]) {
    if (!papers || papers.length === 0) return;

    // --- 性能优化：批量获取所有相关联数据 ---
    const paperIds = papers.map(p => p.id);
    
    const [
        { data: allRelProj },
        { data: allRelDir },
        { data: allRelType },
        { data: allFigs },
        { data: allProjects },
        { data: allDirections },
        { data: allTypes }
    ] = await Promise.all([
        supabase.from("prism_paper_projects").select("paper_id, project_id").in("paper_id", paperIds),
        supabase.from("prism_paper_directions").select("paper_id, direction_id").in("paper_id", paperIds),
        supabase.from("prism_paper_types").select("paper_id, type_id").in("paper_id", paperIds),
        supabase.from("prism_paper_figures").select("*").in("paper_id", paperIds).order("sort_order"),
        supabase.from("prism_projects").select("id, name"),
        supabase.from("prism_directions").select("id, name"),
        supabase.from("prism_types").select("id, name")
    ]);

    // 构建 ID 到名称的映射表
    const projMap = new Map(allProjects?.map(i => [i.id, i.name]));
    const dirMap = new Map(allDirections?.map(i => [i.id, i.name]));
    const typeMap = new Map(allTypes?.map(i => [i.id, i.name]));

    for (const paper of papers) {
        // 在内存中过滤属于当前论文的数据
        const projectNames = (allRelProj || [])
            .filter(r => r.paper_id === paper.id)
            .map(r => projMap.get(r.project_id))
            .filter(Boolean) as string[];

        const directionNames = (allRelDir || [])
            .filter(r => r.paper_id === paper.id)
            .map(r => dirMap.get(r.direction_id))
            .filter(Boolean) as string[];

        const typeNames = (allRelType || [])
            .filter(r => r.paper_id === paper.id)
            .map(r => typeMap.get(r.type_id))
            .filter(Boolean) as string[];

        const figs = (allFigs || []).filter(f => f.paper_id === paper.id);

        // 构造结构化 JSON
        const paperData = {
            ...paper,
            projects: projectNames,
            directions: directionNames,
            types: typeNames,
            figures: figs.map(f => ({ url: f.url, description: f.description }))
        };
        delete paperData.id;

        // 生成 Markdown 预览
        let md = `# ${paper.title}\n\n`;
        md += `> ${paper.nickname || 'No Nickname'} | ${paper.year || 'N/A'} | Rating: ${paper.rating}\n\n`;
        md += `**Authors:** ${paper.authors || '-'}\n\n`;
        md += `**URL:** ${paper.url || '-'}\n\n`;
        md += `## Summary\n${paper.summary || 'No summary.'}\n\n`;
        md += `## Key Contributions\n${(paper.key_contributions || []).map((c: string) => `- ${c}`).join('\n')}\n\n`;
        
        if (figs.length > 0) {
            md += `## Figures\n\n`;
            figs.forEach((f: any) => {
                md += `![${f.description || 'Figure'}](${f.url})\n\n_${f.description || ''}_\n\n`;
            });
        }
        
        const notesMarkdown = tiptapToMarkdown(paper.notes);
        md += `## Notes\n${notesMarkdown || 'No notes.'}\n`;

        const subFolderName = `${paper.year || '0000'}_${(paper.nickname || paper.title).slice(0, 30).replace(/[\\/:*?"<>|]/g, '_')}`;
        const paperSubFolder = papersFolder.folder(subFolderName);
        if (paperSubFolder) {
            paperSubFolder.file("paper.json", JSON.stringify(paperData, null, 2));
            paperSubFolder.file("reading_note.md", md);
        }
    }
}

/**
 * 导出单篇或全部论文为 ZIP
 */
export async function exportPapersToZip(papers: any[]) {
    if (!papers || papers.length === 0) return;

    const zip = new JSZip();
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 16).replace('T', '_');
    
    const rootFolderName = papers.length > 1 ? `papers_backup_${timestamp}` : "paper_export";
    const papersFolder = zip.folder(rootFolderName);
    if (!papersFolder) return;

    await writePapersBackup(papersFolder, papers);

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    const downloadName = papers.length > 1 
        ? `Prism_Papers_Full_Backup_${timestamp}.zip` 
        : `Paper_Export_${papers[0].nickname || 'doc'}.zip`;
    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * 检查论文名冲突并生成新名称
 */
async function getSafePaperTitle(originalTitle: string): Promise<string> {
    const { data } = await supabase.from('prism_papers').select('title');
    const existingTitles = new Set(data?.map(p => p.title) || []);
    
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
 * 导入单篇论文
 */
export async function importPaperFromJson(paperData: any) {
    // 1. 基础校验 (增加防御性类型检查)
    if (!paperData || !paperData.title) {
        throw new Error("导入失败：JSON 文件缺少标题字段");
    }

    // 2. 论文查重与后缀处理
    const finalTitle = await getSafePaperTitle(paperData.title);

    // 3. 准备主记录
    const payload = { ...paperData, title: finalTitle };
    const projects = Array.isArray(payload.projects) ? payload.projects : [];
    const directions = Array.isArray(payload.directions) ? payload.directions : [];
    const types = Array.isArray(payload.types) ? payload.types : [];
    const figures = Array.isArray(payload.figures) ? payload.figures : [];
    
    // 清除关联字段，避免主表插入失败
    delete payload.projects;
    delete payload.directions;
    delete payload.types;
    delete payload.figures;
    delete payload.id;

    // 4. 插入主表
    const { data: newPaper, error: pError } = await supabase
        .from("prism_papers")
        .insert([payload])
        .select()
        .single();
    
    if (pError) throw pError;

    // 5. 建立关联 (带回退逻辑)
    try {
        const [pIds, dIds, tIds] = await Promise.all([
            Promise.all(projects.map((name: string) => getOrCreateDictId('prism_projects', name))),
            Promise.all(directions.map((name: string) => getOrCreateDictId('prism_directions', name))),
            Promise.all(types.map((name: string) => getOrCreateDictId('prism_types', name)))
        ]);

        const pid = newPaper.id;
        const relInserts = [
            ...pIds.map(id => supabase.from("prism_paper_projects").insert({ paper_id: pid, project_id: id })),
            ...dIds.map(id => supabase.from("prism_paper_directions").insert({ paper_id: pid, direction_id: id })),
            ...tIds.map(id => supabase.from("prism_paper_types").insert({ paper_id: pid, type_id: id })),
            ...figures.map((f: any, i: number) => supabase.from("prism_paper_figures").insert({ 
                paper_id: pid, 
                url: f.url, 
                description: f.description, 
                sort_order: i 
            }))
        ];

        const results = await Promise.all(relInserts);
        const firstError = results.find(r => r.error);
        if (firstError) throw firstError.error;

    } catch (err: any) {
        // 回退
        await supabase.from("prism_papers").delete().eq("id", newPaper.id);
        throw new Error(`建立论文关联失败，已回退: ${err.message}`);
    }

    return finalTitle;
}

// ============================================================
// CODEBASE (Language & Tools) MODULE IO
// ============================================================

export type LanguageExportRecord = {
    id: string;
    name: string;
    icon?: string | null;
    color?: string | null;
    sort_order?: number;
};

type CodebaseNodeRecord = {
    id: string;
    language_id: string;
    parent_id?: string | null;
    title: string;
    level: number;
    notes?: string | null;
    sort_order: number;
};

/**
 * 写入单门语言的备份包内容
 */
async function writeLanguageBackup(folder: JSZip, language: LanguageExportRecord) {
    const { data: nodes, error: nError } = await supabase
        .from('prism_codebase_nodes')
        .select('*')
        .eq('language_id', language.id)
        .order('level')
        .order('sort_order');

    if (nError) throw nError;

    const allNodes: CodebaseNodeRecord[] = nodes || [];

    // 1. 生成 manifest.json
    const manifest = {
        name: language.name,
        icon: language.icon,
        color: language.color,
        sort_order: language.sort_order,
        node_count: allNodes.length,
        export_date: new Date().toISOString(),
        version: '1.0'
    };
    folder.file('manifest.json', JSON.stringify(manifest, null, 2));

    // 2. 生成 data/nodes.json（纯系统备份数据）
    const dataFolder = folder.folder('data');
    if (dataFolder) {
        const cleanNodes = allNodes.map(n => ({
            id: n.id,
            parent_id: n.parent_id,
            title: n.title,
            level: n.level,
            notes: n.notes,
            sort_order: n.sort_order
        }));
        dataFolder.file('nodes.json', JSON.stringify(cleanNodes, null, 2));
    }

    // 3. 生成 markdown/ 独立阅读区
    const markdownFolder = folder.folder('markdown');
    
    // 构建辅助 Map
    const nodeMap = new Map<string, CodebaseNodeRecord>(allNodes.map(n => [n.id, n]));
    const childrenMap = new Map<string | null, CodebaseNodeRecord[]>();
    for (const n of allNodes) {
        const pid = n.parent_id || null;
        if (!childrenMap.has(pid)) childrenMap.set(pid, []);
        childrenMap.get(pid)!.push(n);
    }

    // 对每个父节点下的所有同级子节点，按 sort_order 升序稳定排序
    for (const [, children] of childrenMap) {
        children.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    }

    // 建立同级相对连续序号映射表 (基于当前兄弟节点排列的真实顺位 1, 2, 3...)
    const siblingIndexMap = new Map<string, number>();
    for (const [, children] of childrenMap) {
        children.forEach((child, index) => {
            siblingIndexMap.set(child.id, index + 1);
        });
    }

    // 计算每个节点的相对文件路径与文件名
    const getPathForNode = (node: CodebaseNodeRecord): { dir: string; filename: string; fullRelPath: string } => {
        const relativeIndex = siblingIndexMap.get(node.id) ?? node.sort_order ?? 1;
        const prefix = relativeIndex.toString().padStart(2, '0');
        const safeTitle = safeArchiveName(node.title);
        const hasChildren = (childrenMap.get(node.id) || []).length > 0;

        if (node.level === 1) {
            if (hasChildren) {
                const dir = `${prefix}_${safeTitle}`;
                return { dir, filename: 'index.md', fullRelPath: `${dir}/index.md` };
            }
            return { dir: '', filename: `${prefix}_${safeTitle}.md`, fullRelPath: `${prefix}_${safeTitle}.md` };
        }

        // Level 2 或更高
        const parent = node.parent_id ? nodeMap.get(node.parent_id) : null;
        const parentPath = parent ? getPathForNode(parent) : { dir: '' };
        const baseDir = parentPath.dir ? parentPath.dir : '';

        if (hasChildren) {
            const currentDir = baseDir ? `${baseDir}/${prefix}_${safeTitle}` : `${prefix}_${safeTitle}`;
            return { dir: currentDir, filename: 'index.md', fullRelPath: `${currentDir}/index.md` };
        }

        const fullDir = baseDir;
        const filename = `${prefix}_${safeTitle}.md`;
        return { dir: fullDir, filename, fullRelPath: fullDir ? `${fullDir}/${filename}` : filename };
    };

    const treeListForReadme: string[] = [];

    // 使用深度优先遍历 (DFS) 渲染节点文件并生成树状大纲
    const renderNodeTree = (parentId: string | null, depth = 0) => {
        const children = childrenMap.get(parentId) || [];
        for (const n of children) {
            const { dir, filename, fullRelPath } = getPathForNode(n);
            const targetFolder = dir ? markdownFolder?.folder(dir) : markdownFolder;

            let mdContent = `# ${n.title}\n\n`;
            if (n.notes) {
                mdContent += `${tiptapToMarkdown(n.notes)}\n`;
            } else {
                mdContent += `*（本节暂无笔记与代码示例）*\n`;
            }

            if (targetFolder) {
                targetFolder.file(filename, mdContent);
            }

            const indent = '  '.repeat(depth);
            treeListForReadme.push(`${indent}- [${n.title}](./markdown/${encodeURI(fullRelPath)})`);

            // 递归渲染子级节点
            renderNodeTree(n.id, depth + 1);
        }
    };

    if (markdownFolder) {
        renderNodeTree(null, 0);
    }

    // 4. 生成 README.md 总导览
    let readme = `# ${language.name} 知识库与速查手册\n\n`;
    readme += `*导出时间：${new Date().toLocaleString('zh-CN')} | 知识节点总数：${allNodes.length}*\n\n`;
    readme += `## 目录大纲\n\n`;

    if (treeListForReadme.length > 0) {
        readme += treeListForReadme.join('\n') + '\n';
    } else {
        readme += `*暂无知识节点*\n`;
    }

    folder.file('README.md', readme);
}

/**
 * 导出单门语言为 ZIP
 */
export async function exportLanguageToZip(language: LanguageExportRecord) {
    const zip = new JSZip();
    await writeLanguageBackup(zip, language);

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Codebase_${safeArchiveName(language.name)}_Backup.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * 导出所有语言工具为总 ZIP 备份
 */
export async function exportAllLanguagesToZip(languages: LanguageExportRecord[]) {
    const zip = new JSZip();
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 16).replace('T', '_');

    zip.file('manifest.json', JSON.stringify({
        type: 'prism_codebase_backup',
        version: '1.0',
        export_date: now.toISOString(),
        language_count: languages.length
    }, null, 2));

    const languagesFolder = zip.folder('languages');
    if (!languagesFolder) return;

    for (const [index, lang] of languages.entries()) {
        const langFolder = languagesFolder.folder(`${String(index + 1).padStart(2, '0')}_${safeArchiveName(lang.name)}`);
        if (langFolder) await writeLanguageBackup(langFolder, lang);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Prism_Codebase_Full_Backup_${timestamp}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * 检查语言名冲突并获取安全名称
 */
async function getSafeLanguageName(originalName: string): Promise<string> {
    const { data } = await supabase.from('prism_codebase_languages').select('name');
    const existingNames = new Set(data?.map(l => l.name) || []);

    if (!existingNames.has(originalName)) return originalName;

    let counter = 1;
    let newName = `${originalName}_${counter.toString().padStart(2, '0')}`;
    while (existingNames.has(newName)) {
        counter++;
        newName = `${originalName}_${counter.toString().padStart(2, '0')}`;
    }
    return newName;
}

/**
 * 从 ZIP 中还原导入单门语言
 */
export async function importLanguageFromZip(zip: JSZip, basePath: string = '') {
    const manifestFile = zip.file(`${basePath}manifest.json`);
    if (!manifestFile) throw new Error("无效的语言备份包：缺少 manifest.json");

    const manifest = JSON.parse(await manifestFile.async("string"));
    const finalName = await getSafeLanguageName(manifest.name || "Imported_Language");

    // 获取当前最大排序号并 +1
    const { data: countData } = await supabase
        .from('prism_codebase_languages')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

    const nextSortOrder = countData && countData.length > 0 ? countData[0].sort_order + 1 : 0;

    // 1. 创建语言主记录
    const { data: newLang, error: langError } = await supabase
        .from('prism_codebase_languages')
        .insert([{
            name: finalName,
            icon: manifest.icon || 'Code',
            color: manifest.color || 'emerald',
            sort_order: nextSortOrder
        }])
        .select()
        .single();

    if (langError) throw langError;

    // 2. 读取并恢复树状节点
    try {
        const nodesFile = zip.file(`${basePath}data/nodes.json`);
        if (!nodesFile) {
            // 没有节点文件，仅创建语言
            return { languageName: finalName, nodeCount: 0 };
        }

        const rawNodes: any[] = JSON.parse(await nodesFile.async("string"));
        if (!Array.isArray(rawNodes) || rawNodes.length === 0) {
            return { languageName: finalName, nodeCount: 0 };
        }

        // 按 level 从浅到深排序，保证父节点始终先插入
        const sortedNodes = [...rawNodes].sort((a, b) => (a.level || 1) - (b.level || 1));
        const idMap = new Map<string, string>(); // oldId -> newId

        for (const node of sortedNodes) {
            const mappedParentId = node.parent_id ? idMap.get(node.parent_id) || null : null;

            const { data: insertedNode, error: nodeError } = await supabase
                .from('prism_codebase_nodes')
                .insert([{
                    language_id: newLang.id,
                    parent_id: mappedParentId,
                    title: node.title || '未命名节点',
                    level: node.level || 1,
                    notes: node.notes || null,
                    sort_order: node.sort_order ?? 0
                }])
                .select()
                .single();

            if (nodeError) throw nodeError;
            if (node.id && insertedNode) {
                idMap.set(node.id, insertedNode.id);
            }
        }

        return { languageName: finalName, nodeCount: sortedNodes.length };
    } catch (err: any) {
        // 发生错误时回退清除新建的语言
        console.error("Language import failed, rolling back...", err);
        await supabase.from('prism_codebase_nodes').delete().eq('language_id', newLang.id);
        await supabase.from('prism_codebase_languages').delete().eq('id', newLang.id);
        throw new Error(`知识节点导入失败，已回退语言创建: ${err.message}`);
    }
}

// ============================================================
// ENTIRE PRISM SYSTEM IO (Full Archive)
// ============================================================

/**
 * 认知棱镜全库一键总导出
 * 涵盖论文库、课程笔记、语言与工具三大体系
 */
export async function exportEntirePrismToZip(onProgress?: (status: string) => void) {
    onProgress?.("正在加载全库数据清单...");

    // 1. 并行拉取三大模块的主列表
    const [
        { data: papers, error: pError },
        { data: courses, error: cError },
        { data: languages, error: lError }
    ] = await Promise.all([
        supabase.from("prism_papers").select("*").order("year", { ascending: false }),
        supabase.from("prism_courses").select("*").order("sort_order"),
        supabase.from("prism_codebase_languages").select("*").order("sort_order")
    ]);

    if (pError) throw pError;
    if (cError) throw cError;
    if (lError) throw lError;

    const allPapers = papers || [];
    const allCourses = courses || [];
    const allLanguages = languages || [];

    const zip = new JSZip();
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 16).replace('T', '_');

    // 2. 全局 manifest.json
    const manifest = {
        type: "prism_complete_archive",
        version: "1.0",
        export_date: now.toISOString(),
        stats: {
            papers_count: allPapers.length,
            courses_count: allCourses.length,
            languages_count: allLanguages.length
        }
    };
    zip.file("manifest.json", JSON.stringify(manifest, null, 2));

    // 3. 导出论文库模块
    onProgress?.(`正在打包论文库 (${allPapers.length} 篇)...`);
    const papersFolder = zip.folder("papers");
    if (papersFolder && allPapers.length > 0) {
        await writePapersBackup(papersFolder, allPapers);
    }

    // 4. 导出课程笔记模块
    onProgress?.(`正在打包课程笔记 (${allCourses.length} 门)...`);
    const coursesFolder = zip.folder("courses");
    if (coursesFolder) {
        for (const [index, course] of allCourses.entries()) {
            const courseFolder = coursesFolder.folder(
                `${String(index + 1).padStart(2, '0')}_${safeArchiveName(course.name)}`
            );
            if (courseFolder) await writeCourseBackup(courseFolder, course);
        }
    }

    // 5. 导出语言与工具模块
    onProgress?.(`正在打包语言与工具手册 (${allLanguages.length} 门)...`);
    const codebaseFolder = zip.folder("codebase");
    if (codebaseFolder) {
        for (const [index, lang] of allLanguages.entries()) {
            const langFolder = codebaseFolder.folder(
                `${String(index + 1).padStart(2, '0')}_${safeArchiveName(lang.name)}`
            );
            if (langFolder) await writeLanguageBackup(langFolder, lang);
        }
    }

    // 6. 生成认知棱镜全局总导览 README.md
    onProgress?.("正在生成全景知识总导览...");
    let rootReadme = `# 认知棱镜 (Cognitive Prism) 全库知识总备\n\n`;
    rootReadme += `> 思想迸发，光芒始生。涵盖论文深度体系、系统性课程笔记与极致结构化的语言工具手册。\n\n`;
    rootReadme += `*归档时间：${now.toLocaleString('zh-CN')} | 归档规范：v1.0*\n\n`;
    rootReadme += `## 模块知识资产概览\n\n`;
    rootReadme += `| 模块名称 | 收录统计 | 存储目录 | 说明 |\n`;
    rootReadme += `|---|---|---|---|\n`;
    rootReadme += `| **论文库 (Papers)** | ${allPapers.length} 篇论文 | [./papers/](./papers/) | 深度阅读笔记、核心贡献与论文配图 |\n`;
    rootReadme += `| **课程笔记 (Courses)** | ${allCourses.length} 门系统课程 | [./courses/](./courses/) | 章节拆解、独立 Markdown 与 LaTeX 公式推导 |\n`;
    rootReadme += `| **语言与工具 (Codebase)** | ${allLanguages.length} 门语言/工具 | [./codebase/](./codebase/) | 深度多级树状速查手册与原生代码片段 |\n\n`;

    rootReadme += `## 目录结构指引\n\n`;
    rootReadme += `1. **[papers/](./papers/)**：每篇论文独立文件夹，内含结构化 \`paper.json\` 及可离线阅读的 \`reading_note.md\`。\n`;
    rootReadme += `2. **[courses/](./courses/)**：每门课程含总导览 \`README.md\`，其下的 \`markdown/\` 目录包含各章笔记，\`chapters/\` 包含数据备份。\n`;
    rootReadme += `3. **[codebase/](./codebase/)**：每门语言工具含树状 \`README.md\` 大纲，其下的 \`markdown/\` 目录按多级目录分类存储手记。\n`;

    zip.file("README.md", rootReadme);

    // 7. 生成压缩包并触发下载
    onProgress?.("正在生成压缩包并启动下载...");
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Prism_Complete_Archive_${timestamp}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
