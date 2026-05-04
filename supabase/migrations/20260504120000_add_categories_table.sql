-- Categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can insert categories"
  ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete categories"
  ON public.categories FOR DELETE USING (true);

-- Seed default categories
INSERT INTO public.categories (name) VALUES
  ('חלב'),
  ('גבינות'),
  ('ירקות'),
  ('פירות'),
  ('קטניות'),
  ('אגוזים וגרעינים'),
  ('דגנים'),
  ('שתייה'),
  ('בשר'),
  ('חומרי ניקוי'),
  ('קמח'),
  ('תינוקות'),
  ('הגיינה'),
  ('אחר');
