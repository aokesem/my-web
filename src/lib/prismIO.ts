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
        
        md += `## Notes\n${paper.notes || 'No notes.'}\n`;

        const subFolderName = `${paper.year || '0000'}_${(paper.nickname || paper.title).slice(0, 30).replace(/[\\/:*?"<>|]/g, '_')}`;
        const paperSubFolder = papersFolder.folder(subFolderName);
        if (paperSubFolder) {
            paperSubFolder.file("paper.json", JSON.stringify(paperData, null, 2));
            paperSubFolder.file("reading_note.md", md);
        }
    }

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
