import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAdminRole } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

type Context = { params: Promise<{ key: string }> };
const allowedKeys = z.enum(["business.public", "contact.public", "delivery.public", "social.public", "seo.public", "checkout.reservation"]);
const bodySchema = z.object({ value: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])), isPublic: z.boolean() });

export async function PATCH(request: Request, { params }: Context) {
  if (!await requireAdminRole()) return Response.json({ message: "Alleen een beheerder kan instellingen wijzigen." }, { status: 403 });
  const key = allowedKeys.safeParse(decodeURIComponent((await params).key));
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!key.success || !body.success) return Response.json({ message: "Ongeldige instelling." }, { status: 400 });
  if (key.data === "checkout.reservation") {
    const minutes = Number(body.data.value.minutes);
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60) return Response.json({ message: "Kies 1 tot 60 minuten." }, { status: 400 });
    body.data.isPublic = false;
  }
  const supabase = createAdminClient();
  if (!supabase) return Response.json({ message: "Supabase is niet geconfigureerd." }, { status: 503 });
  const result = await supabase.from("site_settings").update({ value: body.data.value, is_public: body.data.isPublic }).eq("key", key.data);
  if (result.error) return Response.json({ message: "Opslaan is niet gelukt." }, { status: 500 });
  revalidateTag("site-settings", "max"); revalidatePath("/"); revalidatePath("/contact"); revalidatePath("/admin/instellingen");
  return Response.json({ ok: true });
}
