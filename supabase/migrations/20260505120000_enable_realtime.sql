-- Enable Supabase Realtime for all three tables so that
-- postgres_changes subscriptions actually receive events.
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;

-- REPLICA IDENTITY FULL ensures DELETE events include full old-row data,
-- not just the primary key (required for Supabase Realtime to broadcast deletes).
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.shopping_items REPLICA IDENTITY FULL;
ALTER TABLE public.categories REPLICA IDENTITY FULL;
