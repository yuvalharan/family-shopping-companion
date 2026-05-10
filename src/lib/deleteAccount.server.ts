import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const deleteAuthUserFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => data as { token: string })
  .handler(async ({ data }) => {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(data.token);
    if (error || !user) throw new Error("Unauthorized");
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (deleteError) throw new Error(deleteError.message);
    return { ok: true };
  });
