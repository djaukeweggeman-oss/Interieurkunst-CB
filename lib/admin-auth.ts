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
  const { data: profile } = await adminClient.from("profiles").select("id,full_name,role").eq("id", userId).maybeSingle();
  return profile ? {
    id: userId,
    email: typeof data.claims.email === "string" ? data.claims.email : null,
    fullName: profile.full_name,
    role: profile.role,
  } : null;
}

export async function requireAdminRole() {
  const user = await getAdminUser();
  return user?.role === "admin" ? user : null;
}
