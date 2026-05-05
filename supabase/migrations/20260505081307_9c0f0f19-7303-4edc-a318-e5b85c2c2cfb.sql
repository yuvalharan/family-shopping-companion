
-- Clear existing shopping items (not associated with a list yet)
DELETE FROM public.shopping_items;

CREATE TABLE public.shopping_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shopping_lists" ON public.shopping_lists FOR SELECT USING (true);
CREATE POLICY "Anyone can insert shopping_lists" ON public.shopping_lists FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update shopping_lists" ON public.shopping_lists FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete shopping_lists" ON public.shopping_lists FOR DELETE USING (true);

ALTER TABLE public.shopping_items
  ADD COLUMN shopping_list_id uuid NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE;

CREATE INDEX idx_shopping_items_list_id ON public.shopping_items(shopping_list_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_lists;
