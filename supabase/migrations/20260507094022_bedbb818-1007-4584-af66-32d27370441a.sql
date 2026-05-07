
-- Ensure trigger creates a personal space for new users
DROP TRIGGER IF EXISTS on_auth_user_created_personal_space ON auth.users;
CREATE TRIGGER on_auth_user_created_personal_space
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_personal_space();

-- Backfill personal spaces for any existing users that don't have one
INSERT INTO public.shared_spaces (name, owner_id, is_personal)
SELECT 'אישי', u.id, true
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.shared_spaces s WHERE s.owner_id = u.id AND s.is_personal = true
);

INSERT INTO public.space_members (space_id, user_id)
SELECT s.id, s.owner_id
FROM public.shared_spaces s
WHERE s.is_personal = true
  AND NOT EXISTS (
    SELECT 1 FROM public.space_members m WHERE m.space_id = s.id AND m.user_id = s.owner_id
  );

-- Harden RPC access: invite info should be callable by anyone with the code (to allow viewing before joining),
-- but accept_invite requires authentication (already enforced in function body).
REVOKE ALL ON FUNCTION public.accept_invite(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.accept_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_invite_space(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_space_members(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_space_members(uuid) FROM anon;
