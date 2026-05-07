
-- Fix: owner could not read back their newly created space because the SELECT
-- policy required an existing space_members row, but that row is inserted
-- only after the INSERT+RETURNING round-trip completes.
-- Allow the owner to always see their own space (they will be added as a member
-- immediately after, so this extra clause has no practical security impact).
DROP POLICY "Members view spaces" ON public.shared_spaces;
CREATE POLICY "Members view spaces" ON public.shared_spaces
  FOR SELECT USING (
    public.is_space_member(id, auth.uid()) OR auth.uid() = owner_id
  );
