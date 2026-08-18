import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
export { createSubmissionHash, sanitizePlainText } from "@/lib/security-core";

function requestFingerprint(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? "unknown";
  const secret = process.env.RATE_LIMIT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "local-unconfigured";
  return createHash("sha256").update(`${secret}\u001f${forwarded}\u001f${userAgent}`).digest("hex");
}

export async function checkServerRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number,
) {
  const supabase = createAdminClient();
  if (!supabase) return { allowed: false, configured: false };
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_scope: scope,
    p_key_hash: requestFingerprint(request),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error(`[security] Rate limiting niet beschikbaar voor ${scope}.`);
    return { allowed: false, configured: true };
  }
  return { allowed: data, configured: true };
}

export function secretsMatch(provided: string | null, expected: string | undefined) {
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

export function logServerError(area: string, error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "unknown";
  console.error(`[${area}] Veilige serverfout (${code}).`);
}
