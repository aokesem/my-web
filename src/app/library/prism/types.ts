export interface PaperDetail {
    id: string;
    title: string;
    nickname?: string;
    authors?: string;
    year?: number;
    url?: string;
    projects: string[];
    directions: string[];
    types: string[];
    summary?: string;
    notes?: string;
    rating?: number;
    read_depth: '精读' | '粗读';
    created_at: string;
    key_contributions?: string[];
    figures?: { url: string; description: string }[];
    /** 论文数据模块：自由说明（对比对象、打分方式等） */
    data_notes?: string;
}

export interface PrismDataset {
    id: string;
    name: string;
    access_url?: string | null;
    format_note: string;
    sort_order: number;
    category_id?: string | null;
    created_at?: string;
}

export interface PrismMetric {
    id: string;
    name: string;
    format_note: string;
    sort_order: number;
    category_id?: string | null;
    created_at?: string;
}

export type PrismDataCategoryKind = 'datasets' | 'metrics';

export interface PrismDataCategory {
    id: string;
    kind: PrismDataCategoryKind;
    name: string;
    sort_order: number;
    created_at?: string;
}

export interface PaperDataLinks {
    datasetIds: string[];
    metricIds: string[];
}

export interface ProjectTimelineEvent {
    id: string;
    date: string;
    content: string;
}

export interface ProjectInsight {
    id: string;
    /** 项目内唯一，用于列表展示与综合条引用 */
    title: string;
    content: string;
    paper_ids: string[];
    /** 关联的调查方向（议程版本子条 id） */
    survey_ids: string[];
    created_at?: string;
}

export interface ProjectCategory<T> {
    category: string;
    items: T[];
}

export interface ProjectData {
    id: string;
    name: string;
    timeline: ProjectTimelineEvent[];
    insights: ProjectCategory<ProjectInsight>[];
}

/** 项目 Tab 左栏「研究问题与背景」议程版本（三块正文拆为子表，按子条 `created_at` 进时间线） */
export interface ProjectAgendaVersion {
    id: string;
    project_id: string;
    label: string | null;
    sort_order: number;
    created_at: string;
}

export interface ProjectAgendaDriveItem {
    id: string;
    agenda_version_id: string;
    title: string;
    content: string;
    sort_order: number;
    created_at: string;
}

export interface ProjectAgendaSurveyItem {
    id: string;
    agenda_version_id: string;
    title: string;
    content: string;
    sort_order: number;
    created_at: string;
}

export interface ProjectAgendaSynthesisItem {
    id: string;
    agenda_version_id: string;
    content: string;
    sort_order: number;
    created_at: string;
    /** 关联的启示 id（来自 prism_synthesis_insight_refs） */
    insight_ref_ids: string[];
}

export interface ProjectAgendaItemsBundle {
    drive: ProjectAgendaDriveItem[];
    survey: ProjectAgendaSurveyItem[];
    synthesis: ProjectAgendaSynthesisItem[];
}

// ============================================================
// DIRECTION / RESEARCH QUESTIONS MODULE
// ============================================================

export interface ResearchQuestion {
    id: string;
    project_id: string;
    content: string;
    sort_order: number;
    created_at: string;
    paper_ids: string[];
}

export interface InnovationPoint {
    id: string;
    question_id: string;
    paper_id?: string;
    content: string;
    sort_order: number;
    created_at: string;
}

export interface DirectionNote {
    id: string;
    project_id: string;
    column_side: 'left' | 'right';
    content: string;
    sort_order: number;
    created_at: string;
    parent_id?: string | null;
}

// ============================================================
// COURSE NOTES MODULE
// ============================================================

export interface Course {
    id: string;
    name: string;
    name_en?: string;
    icon?: string;
    color?: string;
    description?: string;
    sort_order: number;
    created_at: string;
}

export interface CourseChapter {
    id: string;
    course_id: string;
    title: string;
    notes?: string; // Tiptap JSON string
    sort_order: number;
    created_at: string;
}

export interface CourseFormula {
    id: string;
    course_id: string;
    chapter_id?: string | null;
    name: string;
    latex: string;
    description?: string;
    sort_order: number;
    created_at: string;
}

// ============================================================
// CODEBASE (Language & Tools) MODULE
// ============================================================

export interface CodebaseLanguage {
    id: string;
    name: string;
    icon?: string;
    color?: string;
    sort_order: number;
    created_at: string;
}

export interface CodebaseNode {
    id: string;
    language_id: string;
    parent_id?: string | null;
    title: string;
    level: number;
    notes?: string;
    sort_order: number;
    created_at: string;
}
