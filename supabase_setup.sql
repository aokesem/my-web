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

-- ==========================================
-- PLAYBOOK TASKS SETUP
-- ==========================================

-- Create the playbook_tasks table
CREATE TABLE IF NOT EXISTS playbook_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    parent_id UUID NULL REFERENCES playbook_tasks(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE playbook_tasks ENABLE ROW LEVEL SECURITY;

-- Allow public read access (everyone can see the forest)
CREATE POLICY "Public tasks are viewable by everyone" 
ON playbook_tasks FOR SELECT 
USING (true);

-- Allow authenticated users to insert/update/delete THEIR OWN tasks
-- Note: Assuming you are the only user, auth.uid() = user_id is the standard way to restrict edits.
CREATE POLICY "Users can insert their own tasks" 
ON playbook_tasks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
ON playbook_tasks FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
ON playbook_tasks FOR DELETE 
USING (auth.uid() = user_id);
