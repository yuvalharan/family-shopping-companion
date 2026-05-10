
-- 1. Table
CREATE TABLE public.list_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id uuid NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  share_code text NOT NULL UNIQUE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE INDEX list_shares_list_idx ON public.list_shares(shopping_list_id);

ALTER TABLE public.list_shares ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is a member of the list's space
CREATE OR REPLACE FUNCTION public.can_manage_list_share(_list_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shopping_lists sl
    WHERE sl.id = _list_id AND public.is_space_member(sl.space_id, _user_id)
  );
$$;

CREATE POLICY "Members view list_shares" ON public.list_shares
  FOR SELECT USING (public.can_manage_list_share(shopping_list_id, auth.uid()));

CREATE POLICY "Members create list_shares" ON public.list_shares
  FOR INSERT WITH CHECK (public.can_manage_list_share(shopping_list_id, auth.uid()) AND auth.uid() = created_by);

CREATE POLICY "Members delete list_shares" ON public.list_shares
  FOR DELETE USING (public.can_manage_list_share(shopping_list_id, auth.uid()));

-- 2. Public RPC: get shared list data
CREATE OR REPLACE FUNCTION public.get_shared_list(_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _share record;
  _list record;
  _items jsonb;
  _products jsonb;
BEGIN
  SELECT * INTO _share FROM public.list_shares WHERE share_code = _code;
  IF _share.id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  IF _share.expires_at IS NOT NULL AND _share.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  SELECT id, name, is_completed, group_by_category, category_order, notes, space_id
    INTO _list FROM public.shopping_lists WHERE id = _share.shopping_list_id;
  IF _list.id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(i.*)), '[]'::jsonb) INTO _items
    FROM public.shopping_items i WHERE i.shopping_list_id = _list.id;

  SELECT COALESCE(jsonb_agg(to_jsonb(p.*)), '[]'::jsonb) INTO _products
    FROM public.products p
    WHERE p.id IN (SELECT product_id FROM public.shopping_items WHERE shopping_list_id = _list.id);

  RETURN jsonb_build_object(
    'list', to_jsonb(_list),
    'items', _items,
    'products', _products,
    'expires_at', _share.expires_at
  );
END;
$$;

-- 3. Public RPC: toggle item via share code
CREATE OR REPLACE FUNCTION public.toggle_shared_item(_code text, _item_id uuid, _checked boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _share record;
BEGIN
  SELECT * INTO _share FROM public.list_shares WHERE share_code = _code;
  IF _share.id IS NULL THEN RAISE EXCEPTION 'invalid_share'; END IF;
  IF _share.expires_at IS NOT NULL AND _share.expires_at < now() THEN
    RAISE EXCEPTION 'expired_share';
  END IF;

  UPDATE public.shopping_items
    SET is_checked = _checked
    WHERE id = _item_id AND shopping_list_id = _share.shopping_list_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_list(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_shared_item(text, uuid, boolean) TO anon, authenticated;
