-- Saved lists (templates)
CREATE TABLE public.saved_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own saved_lists" ON public.saved_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saved_lists" ON public.saved_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own saved_lists" ON public.saved_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own saved_lists" ON public.saved_lists FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.saved_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  saved_list_id uuid NOT NULL REFERENCES public.saved_lists(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_needed numeric NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_list_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own saved_list_items" ON public.saved_list_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saved_list_items" ON public.saved_list_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own saved_list_items" ON public.saved_list_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own saved_list_items" ON public.saved_list_items FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_saved_list_items_list ON public.saved_list_items(saved_list_id);