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
}

export interface ProjectTimelineEvent {
    id: string;
    date: string;
    content: string;
}

export interface ProjectInsight {
    id: string;
    content: string;
    paper_ids: string[];
    created_at?: string;
}

export interface ProjectOutcome {
    id: string;
    content: string;
    paper_ids: string[];
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
    outcomes: ProjectCategory<ProjectOutcome>[];
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
    chapter_id?: string;
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
