import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ name: z.string().trim().min(2).max(100), email: z.email().max(254), subject: z.string().trim().min(2).max(150), message: z.string().trim().min(10).max(5000), website: z.string().max(0).optional(), startedAt: z.coerce.number() });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: "Controleer de ingevulde velden." }, { status: 400 });
  if (Date.now() - parsed.data.startedAt < 1500) return Response.json({ message: "Het formulier is te snel verstuurd." }, { status: 429 });
  const supabase = createAdminClient();
  if (!supabase) return Response.json({ ok: true, demo: true }, { status: 202 });
  const { name, email, subject, message } = parsed.data;
  const { error } = await supabase.from("contact_messages").insert({ name, email, subject, message });
  if (error) return Response.json({ message: "Opslaan is tijdelijk niet gelukt." }, { status: 500 });
  return Response.json({ ok: true }, { status: 201 });
}
