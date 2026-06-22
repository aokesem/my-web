export interface IndexedHeading {
    level: number;
    text: string;
    id: string;
}

type HeadingLikeNode = {
    type?: string;
    attrs?: {
        level?: number;
    };
    text?: string;
    content?: HeadingLikeNode[];
};

const HEADING_ID_PREFIX = 'heading';

function normalizeHeadingSlug(text: string) {
    const normalized = text
        .trim()
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, '-')
        .replace(/(^-|-$)/g, '');

    return normalized || 'section';
}

function createHeadingId(text: string, counts: Map<string, number>) {
    const slug = normalizeHeadingSlug(text);
    const occurrence = (counts.get(slug) || 0) + 1;
    counts.set(slug, occurrence);
    return occurrence === 1 ? `${HEADING_ID_PREFIX}-${slug}` : `${HEADING_ID_PREFIX}-${slug}-${occurrence}`;
}

export function indexHeadingsFromJsonContent(content: HeadingLikeNode[] | undefined): IndexedHeading[] {
    if (!Array.isArray(content)) return [];

    const headings: IndexedHeading[] = [];
    const counts = new Map<string, number>();

    const traverse = (node: HeadingLikeNode) => {
        if (node.type === 'heading') {
            const level = node.attrs?.level || 1;
            const text = node.content?.map(child => child.text || '').join('').trim() || '';
            if (text) {
                headings.push({
                    level,
                    text,
                    id: createHeadingId(text, counts),
                });
            }
        }

        if (Array.isArray(node.content)) {
            node.content.forEach(traverse);
        }
    };

    content.forEach(traverse);
    return headings;
}

export function indexHeadingsFromMarkdown(markdown: string): IndexedHeading[] {
    const headings: IndexedHeading[] = [];
    const counts = new Map<string, number>();

    markdown.split('\n').forEach(line => {
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (!match) return;

        const text = match[2].trim();
        if (!text) return;

        headings.push({
            level: match[1].length,
            text,
            id: createHeadingId(text, counts),
        });
    });

    return headings;
}

export function indexHeadingsFromNotes(notes?: string): IndexedHeading[] {
    if (!notes) return [];

    const trimmed = notes.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith('{')) {
        try {
            const parsed = JSON.parse(trimmed) as HeadingLikeNode;
            return indexHeadingsFromJsonContent(parsed.content);
        } catch {
            return indexHeadingsFromMarkdown(trimmed);
        }
    }

    return indexHeadingsFromMarkdown(trimmed);
}

export function syncHeadingIdsInElement(root: ParentNode | null) {
    if (!root) return;

    const headings = root.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6');
    const counts = new Map<string, number>();

    headings.forEach(heading => {
        const text = heading.textContent?.trim() || '';
        if (!text) return;
        heading.id = createHeadingId(text, counts);
    });
}
