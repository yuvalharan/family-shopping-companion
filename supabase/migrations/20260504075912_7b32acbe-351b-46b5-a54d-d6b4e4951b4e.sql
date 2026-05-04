-- Products table (master list)
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  default_quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Shopping items table
CREATE TABLE public.shopping_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity_needed NUMERIC NOT NULL DEFAULT 1,
  is_checked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_shopping_items_product_id ON public.shopping_items(product_id);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth yet — single-household shared app)
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can insert products"
  ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update products"
  ON public.products FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete products"
  ON public.products FOR DELETE USING (true);

CREATE POLICY "Anyone can view shopping_items"
  ON public.shopping_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert shopping_items"
  ON public.shopping_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update shopping_items"
  ON public.shopping_items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete shopping_items"
  ON public.shopping_items FOR DELETE USING (true);