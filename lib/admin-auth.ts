import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getAdminUser() {
  const authClient = await createServerSupabaseClient();
  const adminClient = createAdminClient();
  if (!authClient || !adminClient) return null;
  const { data, error } = await authClient.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) return null;
  const { data: membership } = await adminClient.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle();
  return membership ? { id: userId, email: typeof data.claims.email === "string" ? data.claims.email : null } : null;
}

