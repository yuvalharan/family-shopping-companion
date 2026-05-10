-- Add sort_order to shopping_items for drag-to-reorder persistence
ALTER TABLE public.shopping_items ADD COLUMN IF NOT EXISTS sort_order DOUBLE PRECISION;

-- Backfill sort_order with created_at-based ordering per list
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY shopping_list_id ORDER BY created_at) AS rn
  FROM public.shopping_items
  WHERE sort_order IS NULL
)
UPDATE public.shopping_items si
SET sort_order = o.rn * 1000
FROM ordered o
WHERE si.id = o.id;

CREATE INDEX IF NOT EXISTS shopping_items_list_sort_idx
  ON public.shopping_items (shopping_list_id, sort_order);

-- Add notes (text) to shopping_lists
ALTER TABLE public.shopping_lists ADD COLUMN IF NOT EXISTS notes TEXT;