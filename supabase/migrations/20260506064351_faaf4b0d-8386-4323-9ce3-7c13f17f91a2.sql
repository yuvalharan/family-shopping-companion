-- Add user_id columns
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.shopping_lists ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.shopping_items ADD COLUMN IF NOT EXISTS user_id uuid;

-- Drop old permissive policies
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Anyone can insert products" ON public.products;
DROP POLICY IF EXISTS "Anyone can update products" ON public.products;
DROP POLICY IF EXISTS "Anyone can delete products" ON public.products;

DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can update categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can delete categories" ON public.categories;

DROP POLICY IF EXISTS "Anyone can view shopping_lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Anyone can insert shopping_lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Anyone can update shopping_lists" ON public.shopping_lists;
DROP POLICY IF EXISTS "Anyone can delete shopping_lists" ON public.shopping_lists;

DROP POLICY IF EXISTS "Anyone can view shopping_items" ON public.shopping_items;
DROP POLICY IF EXISTS "Anyone can insert shopping_items" ON public.shopping_items;
DROP POLICY IF EXISTS "Anyone can update shopping_items" ON public.shopping_items;
DROP POLICY IF EXISTS "Anyone can delete shopping_items" ON public.shopping_items;

-- Per-user policies for products
CREATE POLICY "Users view own products" ON public.products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own products" ON public.products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own products" ON public.products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own products" ON public.products FOR DELETE USING (auth.uid() = user_id);

-- Per-user policies for categories
CREATE POLICY "Users view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Per-user policies for shopping_lists
CREATE POLICY "Users view own shopping_lists" ON public.shopping_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own shopping_lists" ON public.shopping_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own shopping_lists" ON public.shopping_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own shopping_lists" ON public.shopping_lists FOR DELETE USING (auth.uid() = user_id);

-- Per-user policies for shopping_items
CREATE POLICY "Users view own shopping_items" ON public.shopping_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own shopping_items" ON public.shopping_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own shopping_items" ON public.shopping_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own shopping_items" ON public.shopping_items FOR DELETE USING (auth.uid() = user_id);