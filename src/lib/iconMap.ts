import {
    SearchCode,
    MessageSquare,
    Terminal,
    Sparkles,
    Cpu,
    Archive,
    Compass,
    Zap,
    Coffee,
    Activity,
    BookOpen,
    Code,
    Palette,
    Layers,
    FileText,
    Settings,
    LayoutDashboard,
    Search,
    Brain,
    Lightbulb
} from 'lucide-react';

export const ICON_MAP: Record<string, any> = {
    // Prompt Icons
    'SearchCode': SearchCode,
    'MessageSquare': MessageSquare,
    'Terminal': Terminal,
    'Sparkles': Sparkles,
    'Cpu': Cpu,
    'Archive': Archive,

    // Mindmap Icons
    'Compass': Compass,
    'Zap': Zap,
    'Coffee': Coffee,
    'Activity': Activity,

    // Garden Icons
    'BookOpen': BookOpen,
    'Code': Code,
    'Palette': Palette,

    // Extras
    'Layers': Layers,
    'FileText': FileText,
    'Settings': Settings,
    'LayoutDashboard': LayoutDashboard,
    'Search': Search,
    'Brain': Brain,
    'Lightbulb': Lightbulb
};

export const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || Layers; // Default to Layers if not found
};
