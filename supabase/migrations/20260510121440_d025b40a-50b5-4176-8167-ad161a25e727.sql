ALTER TABLE public.shopping_lists
  ADD COLUMN IF NOT EXISTS group_by_category boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS category_order text[] NOT NULL DEFAULT '{}'::text[];