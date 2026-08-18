import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { adminProductSchema, toProductRow } from "@/lib/product-validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath, revalidateTag } from "next/cache";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Context) {
  if (!await getAdminUser()) return Response.json({ message: "Niet geautoriseerd." }, { status: 401 });
  const { id } = await params; if (!z.uuid().safeParse(id).success) return Response.json({ message: "Ongeldig id." }, { status: 400 });
  const parsed = adminProductSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Controleer de velden." }, { status: 400 });
  const supabase = createAdminClient();
  if (!supabase) return Response.json({ message: "Supabase is niet volledig geconfigureerd." }, { status: 503 });
  const current = await supabase.from("products").select("published_at").eq("id", id).maybeSingle();
  if (!current.data) return Response.json({ message: "Werk niet gevonden." }, { status: 404 });
  const { error } = await supabase.from("products").update(toProductRow(parsed.data, current.data.published_at)).eq("id", id);
  if (error) return Response.json({ message: "Opslaan is niet gelukt." }, { status: 400 });
  revalidateTag("catalog", "max"); revalidatePath("/collectie"); revalidatePath(`/collectie/${parsed.data.slug}`);
  return Response.json({ id });
}
export async function DELETE(_request: Request, { params }: Context) {
  if (!await getAdminUser()) return Response.json({ message: "Niet geautoriseerd." }, { status: 401 });
  const { id } = await params; if (!z.uuid().safeParse(id).success) return Response.json({ message: "Ongeldig id." }, { status: 400 });
  const supabase = createAdminClient();
  if (!supabase) return Response.json({ message: "Supabase is niet volledig geconfigureerd." }, { status: 503 });
  const { error } = await supabase.from("products").update({ archived_at: new Date().toISOString(), published_at: null, status: "archived" }).eq("id", id);
  if (error) return Response.json({ message: "Archiveren is niet gelukt." }, { status: 400 });
  revalidateTag("catalog", "max"); revalidatePath("/collectie");
  return Response.json({ ok: true });
}
