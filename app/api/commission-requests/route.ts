import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().trim().min(2).max(100), email: z.email().max(254), phone: z.string().trim().max(30).optional(),
  type: z.string().trim().min(2).max(60), size: z.string().trim().max(80).optional(), style: z.string().trim().max(1000).optional(),
  desiredDate: z.string().trim().max(20).optional(), message: z.string().trim().min(20).max(5000), website: z.string().max(0).optional(),
  startedAt: z.coerce.number(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Controleer de ingevulde velden." }, { status: 400 });
  if (Date.now() - parsed.data.startedAt < 1500) return Response.json({ message: "Het formulier is te snel verstuurd." }, { status: 429 });
  const supabase = createAdminClient();
  if (!supabase) return Response.json({ ok: true, demo: true }, { status: 202 });
  const { name, email, phone, type, size, style, desiredDate, message } = parsed.data;
  const { error } = await supabase.from("commission_requests").insert({ name, email, phone, type, size, style, message, desired_date: desiredDate || null });
  if (error) return Response.json({ message: "Opslaan is tijdelijk niet gelukt." }, { status: 500 });
  return Response.json({ ok: true }, { status: 201 });
}
