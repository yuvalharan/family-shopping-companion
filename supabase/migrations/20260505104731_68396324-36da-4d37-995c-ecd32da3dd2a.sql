ALTER TABLE public.shopping_lists ADD COLUMN completed_at timestamp with time zone;
UPDATE public.shopping_lists SET completed_at = now() WHERE is_completed = true AND completed_at IS NULL;