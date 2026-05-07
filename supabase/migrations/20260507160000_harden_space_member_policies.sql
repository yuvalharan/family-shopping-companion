-- Fix 1: Tighten space_members INSERT policy.
-- The old policy (auth.uid() = user_id) allowed any authenticated user to add
-- themselves to any space by knowing the space UUID. Only space owners should
-- be able to insert directly; invite-based joins go through accept_invite()
-- which is SECURITY DEFINER and bypasses RLS.
DROP POLICY "Users insert self as member" ON public.space_members;
CREATE POLICY "Users insert self as member" ON public.space_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.shared_spaces
      WHERE id = space_id AND owner_id = auth.uid()
    )
  );

-- Fix 2: Prevent space owners from removing themselves from space_members.
-- An owner leaving their own space (without deleting it) would create an
-- orphaned space where owner_id points to a non-member, breaking SELECT policies.
-- Owners must delete the space itself instead.
DROP POLICY "Users leave space" ON public.space_members;
CREATE POLICY "Users leave space" ON public.space_members
  FOR DELETE USING (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM public.shared_spaces
      WHERE id = space_id AND owner_id = auth.uid()
    )
  );
