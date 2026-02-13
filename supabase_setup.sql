-- Create the garden_categories table
CREATE TABLE IF NOT EXISTS garden_categories (
    id TEXT PRIMARY KEY, -- Using text ID (e.g., 'learning', 'programming') to match existing data
    title TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'BookOpen', -- name of Lucide icon
    description TEXT,
    color TEXT DEFAULT 'text-teal-500',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE garden_categories ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- Allow public read access
CREATE POLICY "Public categories are viewable by everyone" 
ON garden_categories FOR SELECT 
USING (true);

-- Allow authenticated users (admin) to insert/update/delete
CREATE POLICY "Admins can manage categories" 
ON garden_categories FOR ALL 
USING (auth.role() = 'authenticated');

-- Insert default categories (matching current hardcoded ones)
INSERT INTO garden_categories (id, title, icon, color, sort_order)
VALUES 
    ('learning', '学习笔记', 'BookOpen', 'text-blue-500', 1),
    ('programming', 'AI与编程', 'Code', 'text-purple-500', 2),
    ('creative', 'AI与创作', 'Palette', 'text-pink-500', 3)
ON CONFLICT (id) DO NOTHING;
