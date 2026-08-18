import { secretsMatch } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

async function release(request: Request) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  if (!secretsMatch(bearer, process.env.CRON_SECRET)) return Response.json({ message: "Niet geautoriseerd." }, { status: 401 });
  const supabase = createAdminClient();
  if (!supabase) return Response.json({ message: "Supabase is niet geconfigureerd." }, { status: 503 });
  const { data, error } = await supabase.rpc("release_expired_reservations");
  if (error) return Response.json({ message: "Opschonen is niet gelukt." }, { status: 500 });
  return Response.json({ released: data });
}

export const GET = release;
export const POST = release;
