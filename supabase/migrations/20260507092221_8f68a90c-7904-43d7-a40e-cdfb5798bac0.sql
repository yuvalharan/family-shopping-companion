
-- Clean up orphan rows with no owner (invisible under RLS anyway)
DELETE FROM public.shopping_items WHERE user_id IS NULL;
DELETE FROM public.shopping_lists WHERE user_id IS NULL;
DELETE FROM public.saved_list_items WHERE user_id IS NULL;
DELETE FROM public.saved_lists WHERE user_id IS NULL;
DELETE FROM public.products WHERE user_id IS NULL;
DELETE FROM public.categories WHERE user_id IS NULL;

-- 1. New tables
CREATE TABLE public.shared_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  is_personal boolean NOT NULL DEFAULT false,
  color_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.space_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.shared_spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(space_id, user_id)
);
CREATE INDEX idx_space_members_user ON public.space_members(user_id);
CREATE INDEX idx_space_members_space ON public.space_members(space_id);

CREATE TABLE public.space_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.shared_spaces(id) ON DELETE CASCADE,
  invite_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);
CREATE INDEX idx_space_invites_space ON public.space_invites(space_id);

CREATE OR REPLACE FUNCTION public.is_space_member(_space_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.space_members WHERE space_id = _space_id AND user_id = _user_id);
$$;

ALTER TABLE public.products         ADD COLUMN space_id uuid;
ALTER TABLE public.categories       ADD COLUMN space_id uuid;
ALTER TABLE public.shopping_lists   ADD COLUMN space_id uuid;
ALTER TABLE public.shopping_items   ADD COLUMN space_id uuid;
ALTER TABLE public.saved_lists      ADD COLUMN space_id uuid;
ALTER TABLE public.saved_list_items ADD COLUMN space_id uuid;

DO $$
DECLARE uid uuid; sid uuid;
BEGIN
  FOR uid IN
    SELECT DISTINCT user_id FROM (
      SELECT user_id FROM public.products         WHERE user_id IS NOT NULL
      UNION SELECT user_id FROM public.categories       WHERE user_id IS NOT NULL
      UNION SELECT user_id FROM public.shopping_lists   WHERE user_id IS NOT NULL
      UNION SELECT user_id FROM public.shopping_items   WHERE user_id IS NOT NULL
      UNION SELECT user_id FROM public.saved_lists      WHERE user_id IS NOT NULL
      UNION SELECT user_id FROM public.saved_list_items WHERE user_id IS NOT NULL
    ) u
  LOOP
    INSERT INTO public.shared_spaces (name, owner_id, is_personal) VALUES ('אישי', uid, true) RETURNING id INTO sid;
    INSERT INTO public.space_members (space_id, user_id) VALUES (sid, uid);
    UPDATE public.products         SET space_id = sid WHERE user_id = uid AND space_id IS NULL;
    UPDATE public.categories       SET space_id = sid WHERE user_id = uid AND space_id IS NULL;
    UPDATE public.shopping_lists   SET space_id = sid WHERE user_id = uid AND space_id IS NULL;
    UPDATE public.shopping_items   SET space_id = sid WHERE user_id = uid AND space_id IS NULL;
    UPDATE public.saved_lists      SET space_id = sid WHERE user_id = uid AND space_id IS NULL;
    UPDATE public.saved_list_items SET space_id = sid WHERE user_id = uid AND space_id IS NULL;
  END LOOP;

  INSERT INTO public.shared_spaces (name, owner_id, is_personal)
  SELECT 'אישי', u.id, true FROM auth.users u
  WHERE NOT EXISTS (SELECT 1 FROM public.shared_spaces s WHERE s.owner_id = u.id AND s.is_personal);

  INSERT INTO public.space_members (space_id, user_id)
  SELECT s.id, s.owner_id FROM public.shared_spaces s
  WHERE s.is_personal AND NOT EXISTS (SELECT 1 FROM public.space_members m WHERE m.space_id = s.id AND m.user_id = s.owner_id);
END $$;

ALTER TABLE public.products         ALTER COLUMN space_id SET NOT NULL;
ALTER TABLE public.categories       ALTER COLUMN space_id SET NOT NULL;
ALTER TABLE public.shopping_lists   ALTER COLUMN space_id SET NOT NULL;
ALTER TABLE public.shopping_items   ALTER COLUMN space_id SET NOT NULL;
ALTER TABLE public.saved_lists      ALTER COLUMN space_id SET NOT NULL;
ALTER TABLE public.saved_list_items ALTER COLUMN space_id SET NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user_personal_space()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid;
BEGIN
  INSERT INTO public.shared_spaces (name, owner_id, is_personal) VALUES ('אישי', NEW.id, true) RETURNING id INTO sid;
  INSERT INTO public.space_members (space_id, user_id) VALUES (sid, NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_space
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_personal_space();

ALTER TABLE public.shared_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view spaces" ON public.shared_spaces FOR SELECT USING (public.is_space_member(id, auth.uid()));
CREATE POLICY "Users create spaces" ON public.shared_spaces FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner updates space" ON public.shared_spaces FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner deletes shared space" ON public.shared_spaces FOR DELETE USING (auth.uid() = owner_id AND NOT is_personal);

CREATE POLICY "Members view co-members" ON public.space_members FOR SELECT USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "Users insert self as member" ON public.space_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users leave space" ON public.space_members FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Members view invites" ON public.space_invites FOR SELECT USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "Members create invites" ON public.space_invites FOR INSERT WITH CHECK (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "Members delete invites" ON public.space_invites FOR DELETE USING (public.is_space_member(space_id, auth.uid()));

DROP POLICY "Users view own products"   ON public.products;
DROP POLICY "Users insert own products" ON public.products;
DROP POLICY "Users update own products" ON public.products;
DROP POLICY "Users delete own products" ON public.products;
CREATE POLICY "Members view products"   ON public.products FOR SELECT USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "Members insert products" ON public.products FOR INSERT WITH CHECK (public.is_space_member(space_id, auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "Members update products" ON public.products FOR UPDATE USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "Members delete products" ON public.products FOR DELETE USING (public.is_space_member(space_id, auth.uid()));

DROP POLICY "Users view own categories"   ON public.categories;
DROP POLICY "Users insert own categories" ON public.categories;
DROP POLICY "Users update own categories" ON public.categories;
DROP POLICY "Users delete own categories" ON public.categories;
CREATE POLICY "Members view categories"   ON public.categories FOR SELECT USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "Members insert categories" ON public.categories FOR INSERT WITH CHECK (public.is_space_member(space_id, auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "Members update categories" ON public.categories FOR UPDATE USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "Members delete categories" ON public.categories FOR DELETE USING (public.is_space_member(space_id, auth.uid()));

DROP POLICY "Users view own shopping_lists"   ON public.shopping_lists;
DROP POLICY "Users insert own shopping_lists" ON public.shopping_lists;
DROP POLICY "Users update own shopping_lists" ON public.shopping_lists;
DROP POLICY "Users delete own shopping_lists" ON public.shopping_lists;
CREATE POLICY "Members view shopping_lists"   ON public.shopping_lists FOR SELECT USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "Members insert shopping_lists" ON public.shopping_lists FOR INSERT WITH CHECK (public.is_space_member(space_id, auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "Members update shopping_lists" ON public.shopping_lists FOR UPDATE USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "Members delete shopping_lists" ON public.shopping_lists FOR DELETE USING (public.is_space_member(space_id, auth.uid()));

DROP POLICY "Users view own shopping_items"   ON public.shopping_items;
DROP POLICY "Users insert own shopping_items" ON public.shopping_items;
DROP POLICY "Users update own shopping_items" ON public.shopping_items;
DROP POLICY "Users delete own shopping_items" ON public.shopping_items;
CREATE POLICY "Members view shopping_items"   ON public.shopping_items FOR SELECT USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "Members insert shopping_items" ON public.shopping_items FOR INSERT WITH CHECK (public.is_space_member(space_id, auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "Members update shopping_items" ON public.shopping_items FOR UPDATE USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "Members delete shopping_items" ON public.shopping_items FOR DELETE USING (public.is_space_member(space_id, auth.uid()));

DROP POLICY "Users view own saved_lists"   ON public.saved_lists;
DROP POLICY "Users insert own saved_lists" ON public.saved_lists;
DROP POLICY "Users update own saved_lists" ON public.saved_lists;
DROP POLICY "Users delete own saved_lists" ON public.saved_lists;
CREATE POLICY "Members view saved_lists"   ON public.saved_lists FOR SELECT USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "Members insert saved_lists" ON public.saved_lists FOR INSERT WITH CHECK (public.is_space_member(space_id, auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "Members update saved_lists" ON public.saved_lists FOR UPDATE USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "Members delete saved_lists" ON public.saved_lists FOR DELETE USING (public.is_space_member(space_id, auth.uid()));

DROP POLICY "Users view own saved_list_items"   ON public.saved_list_items;
DROP POLICY "Users insert own saved_list_items" ON public.saved_list_items;
DROP POLICY "Users update own saved_list_items" ON public.saved_list_items;
DROP POLICY "Users delete own saved_list_items" ON public.saved_list_items;
CREATE POLICY "Members view saved_list_items"   ON public.saved_list_items FOR SELECT USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "Members insert saved_list_items" ON public.saved_list_items FOR INSERT WITH CHECK (public.is_space_member(space_id, auth.uid()) AND auth.uid() = user_id);
CREATE POLICY "Members update saved_list_items" ON public.saved_list_items FOR UPDATE USING (public.is_space_member(space_id, auth.uid()));
CREATE POLICY "Members delete saved_list_items" ON public.saved_list_items FOR DELETE USING (public.is_space_member(space_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.get_invite_space(_code text)
RETURNS TABLE(space_id uuid, space_name text, expires_at timestamptz, already_member boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.name, i.expires_at, COALESCE(public.is_space_member(s.id, auth.uid()), false)
  FROM public.space_invites i JOIN public.shared_spaces s ON s.id = i.space_id
  WHERE i.invite_code = _code;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_invite(_code text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid; exp timestamptz;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT space_id, expires_at INTO sid, exp FROM public.space_invites WHERE invite_code = _code;
  IF sid IS NULL THEN RAISE EXCEPTION 'invalid_invite'; END IF;
  IF exp < now() THEN RAISE EXCEPTION 'expired_invite'; END IF;
  INSERT INTO public.space_members (space_id, user_id) VALUES (sid, auth.uid()) ON CONFLICT (space_id, user_id) DO NOTHING;
  RETURN sid;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_space_members(_space_id uuid)
RETURNS TABLE(user_id uuid, email text, joined_at timestamptz, is_owner boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_space_member(_space_id, auth.uid()) THEN RAISE EXCEPTION 'not_member'; END IF;
  RETURN QUERY
  SELECT m.user_id, u.email::text, m.joined_at, (s.owner_id = m.user_id)
  FROM public.space_members m
  JOIN auth.users u ON u.id = m.user_id
  JOIN public.shared_spaces s ON s.id = m.space_id
  WHERE m.space_id = _space_id ORDER BY m.joined_at ASC;
END;
$$;
