import { randomUUID } from "node:crypto";
import { emailService } from "@/lib/email/service";
import { processSafeImage } from "@/lib/image-processing";
import { commissionRequestSchema } from "@/lib/request-validation";
import {
  checkServerRateLimit,
  createSubmissionHash,
  logServerError,
  sanitizePlainText,
} from "@/lib/security";
import { siteConfig } from "@/lib/site-config";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ message: "Het formulier kon niet worden gelezen." }, { status: 400 });
  const parsed = commissionRequestSchema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) {
    return Response.json({ message: parsed.error.issues[0]?.message ?? "Controleer de ingevulde velden." }, { status: 400 });
  }
  if (parsed.data.website) return Response.json({ ok: true }, { status: 202 });
  const elapsed = Date.now() - parsed.data.startedAt;
  if (elapsed < 1500 || elapsed > 24 * 60 * 60 * 1000) {
    return Response.json({ message: "Ververs de pagina en probeer het formulier opnieuw." }, { status: 400 });
  }

  const rateLimit = await checkServerRateLimit(request, "commission", 3, 60 * 60);
  if (!rateLimit.configured) {
    return Response.json({ message: "Het aanvraagformulier is nog niet gekoppeld. Neem voorlopig rechtstreeks contact op." }, { status: 503 });
  }
  if (!rateLimit.allowed) {
    return Response.json({ message: "Je hebt het formulier te vaak verstuurd. Probeer het later opnieuw." }, { status: 429 });
  }
  const supabase = createAdminClient();
  if (!supabase) return Response.json({ message: "Opslaan is tijdelijk niet beschikbaar." }, { status: 503 });

  const requestId = randomUUID();
  const file = form.get("referenceImage");
  let referencePath: string | null = null;
  try {
    if (file instanceof File && file.size > 0) {
      const image = await processSafeImage(file, 8 * 1024 * 1024);
      referencePath = `${requestId}/${randomUUID()}.${image.extension}`;
      const upload = await supabase.storage.from("commission-uploads").upload(referencePath, image.buffer, {
        contentType: image.mime,
        cacheControl: "3600",
        upsert: false,
      });
      if (upload.error) throw upload.error;
    }

    const row = {
      id: requestId,
      name: sanitizePlainText(parsed.data.name, 100),
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone ? sanitizePlainText(parsed.data.phone, 30) : null,
      commission_type: sanitizePlainText(parsed.data.commissionType, 60),
      preferred_size: parsed.data.preferredSize ? sanitizePlainText(parsed.data.preferredSize, 80) : null,
      preferred_style: parsed.data.preferredStyle ? sanitizePlainText(parsed.data.preferredStyle, 1000) : null,
      preferred_colours: parsed.data.preferredColours ? sanitizePlainText(parsed.data.preferredColours, 500) : null,
      desired_date: parsed.data.desiredDate,
      message: sanitizePlainText(parsed.data.message, 5000),
      reference_image_path: referencePath,
      submission_hash: createSubmissionHash("commission", [parsed.data.email, parsed.data.commissionType, parsed.data.message]),
    };
    const { error } = await supabase.from("commission_requests").insert(row);
    if (error?.code === "23505") {
      if (referencePath) await supabase.storage.from("commission-uploads").remove([referencePath]);
      return Response.json({ ok: true, duplicate: true }, { status: 200 });
    }
    if (error) throw error;
    await emailService.queue({
      type: "new_commission_request",
      recipient: process.env.ADMIN_EMAIL ?? siteConfig.email,
      payload: { request_id: requestId, commission_type: row.commission_type },
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (referencePath) await supabase.storage.from("commission-uploads").remove([referencePath]);
    logServerError("commission", error);
    return Response.json({ message: "Je aanvraag kon niet veilig worden opgeslagen. Probeer het later opnieuw." }, { status: 500 });
  }
}
