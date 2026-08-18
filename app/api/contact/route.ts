import { emailService } from "@/lib/email/service";
import { contactRequestSchema } from "@/lib/request-validation";
import {
  checkServerRateLimit,
  createSubmissionHash,
  logServerError,
  sanitizePlainText,
} from "@/lib/security";
import { siteConfig } from "@/lib/site-config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const parsed = contactRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ message: parsed.error.issues[0]?.message ?? "Controleer de ingevulde velden." }, { status: 400 });
  }
  if (parsed.data.website) return Response.json({ ok: true }, { status: 202 });
  const elapsed = Date.now() - parsed.data.startedAt;
  if (elapsed < 1500 || elapsed > 24 * 60 * 60 * 1000) {
    return Response.json({ message: "Ververs de pagina en probeer het formulier opnieuw." }, { status: 400 });
  }

  const rateLimit = await checkServerRateLimit(request, "contact", 5, 60 * 60);
  if (!rateLimit.configured) {
    return Response.json({ message: "Het contactformulier is nog niet gekoppeld. Mail Carolien voorlopig rechtstreeks." }, { status: 503 });
  }
  if (!rateLimit.allowed) {
    return Response.json({ message: "Je hebt het formulier te vaak verstuurd. Probeer het later opnieuw." }, { status: 429 });
  }

  const supabase = createAdminClient();
  if (!supabase) return Response.json({ message: "Opslaan is tijdelijk niet beschikbaar." }, { status: 503 });
  const row = {
    name: sanitizePlainText(parsed.data.name, 100),
    email: parsed.data.email.toLowerCase(),
    phone: parsed.data.phone ? sanitizePlainText(parsed.data.phone, 30) : null,
    subject: sanitizePlainText(parsed.data.subject, 150),
    message: sanitizePlainText(parsed.data.message, 5000),
    submission_hash: createSubmissionHash("contact", [parsed.data.email, parsed.data.subject, parsed.data.message]),
  };
  const { data, error } = await supabase.from("contact_requests").insert(row).select("id").single();
  if (error?.code === "23505") return Response.json({ ok: true, duplicate: true }, { status: 200 });
  if (error || !data) {
    logServerError("contact", error);
    return Response.json({ message: "Je bericht kon niet worden opgeslagen. Probeer het later opnieuw." }, { status: 500 });
  }
  await emailService.queue({
    type: "new_contact_request",
    recipient: process.env.ADMIN_EMAIL ?? siteConfig.email,
    payload: { request_id: data.id, subject: row.subject },
  });
  return Response.json({ ok: true }, { status: 201 });
}
