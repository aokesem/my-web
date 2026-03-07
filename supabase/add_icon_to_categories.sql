-- Adds an icon column to the diet_categories table
ALTER TABLE diet_categories ADD COLUMN icon VARCHAR(50);

-- Migrate existing categories with their default Lucide icons
UPDATE diet_categories SET icon = 'Apple' WHERE name = '水果' AND module = 'foods';
UPDATE diet_categories SET icon = 'Beef' WHERE name = '肉类' AND module = 'foods';
UPDATE diet_categories SET icon = 'Carrot' WHERE name = '蔬菜' AND module = 'foods';
UPDATE diet_categories SET icon = 'Flame' WHERE name = '调味料' AND module = 'foods';

UPDATE diet_categories SET icon = 'Clock' WHERE name = '简餐' AND module = 'recipes';
UPDATE diet_categories SET icon = 'UtensilsCrossed' WHERE name = '正餐' AND module = 'recipes';
UPDATE diet_categories SET icon = 'Coffee' WHERE name = '饮料' AND module = 'recipes';
UPDATE diet_categories SET icon = 'CakeSlice' WHERE name = '甜品' AND module = 'recipes';

-- We can assign a default 'Store' icon to restaurant categories
UPDATE diet_categories SET icon = 'Store' WHERE module = 'restaurants';
