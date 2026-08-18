import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { sanitizePlainText } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

type Context = { params: Promise<{ kind: string; id: string }> };
const contactStatuses = z.enum(["new", "read", "replied", "closed"]);
const commissionStatuses = z.enum(["new", "contacted", "in_discussion", "accepted", "declined", "completed"]);

export async function PATCH(request: Request, { params }: Context) {
  if (!await getAdminUser()) return Response.json({ message: "Niet geautoriseerd." }, { status: 401 });
  const paramsData = await params;
  const id = z.uuid().safeParse(paramsData.id);
  const body = await request.json().catch(() => null) as { status?: unknown; adminNotes?: unknown } | null;
  if (!id.success || !body || !["contact", "commission"].includes(paramsData.kind)) return Response.json({ message: "Ongeldige aanvraag." }, { status: 400 });
  const status = (paramsData.kind === "contact" ? contactStatuses : commissionStatuses).safeParse(body.status);
  const notes = z.string().max(5000).safeParse(body.adminNotes ?? "");
  if (!status.success || !notes.success) return Response.json({ message: "Controleer status en notities." }, { status: 400 });
  const supabase = createAdminClient();
  if (!supabase) return Response.json({ message: "Supabase is niet geconfigureerd." }, { status: 503 });
  const table = paramsData.kind === "contact" ? "contact_requests" : "commission_requests";
  const result = await supabase.from(table).update({ status: status.data, admin_notes: sanitizePlainText(notes.data, 5000) }).eq("id", id.data);
  if (result.error) return Response.json({ message: "Bijwerken is niet gelukt." }, { status: 500 });
  revalidatePath("/admin/aanvragen");
  return Response.json({ ok: true });
}
