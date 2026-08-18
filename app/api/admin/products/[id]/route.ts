import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { adminProductSchema, toProductRow } from "@/lib/product-validation";
import { createAdminClient } from "@/lib/supabase/admin";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  if (!await getAdminUser()) return Response.json({ message: "Niet geautoriseerd." }, { status: 401 });
  const { id } = await params; if (!z.uuid().safeParse(id).success) return Response.json({ message: "Ongeldig id." }, { status: 400 });
  const parsed = adminProductSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Controleer de velden." }, { status: 400 });
  const { error } = await createAdminClient()!.from("products").update(toProductRow(parsed.data)).eq("id", id);
  if (error) return Response.json({ message: "Opslaan is niet gelukt." }, { status: 400 });
  return Response.json({ id });
}
export async function DELETE(_request: Request, { params }: Context) {
  if (!await getAdminUser()) return Response.json({ message: "Niet geautoriseerd." }, { status: 401 });
  const { id } = await params; if (!z.uuid().safeParse(id).success) return Response.json({ message: "Ongeldig id." }, { status: 400 });
  const { error } = await createAdminClient()!.from("products").update({ archived_at: new Date().toISOString(), published: false, status: "hidden" }).eq("id", id);
  if (error) return Response.json({ message: "Archiveren is niet gelukt." }, { status: 400 });
  return Response.json({ ok: true });
}

