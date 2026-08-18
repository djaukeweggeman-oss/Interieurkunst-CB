import { getAdminUser } from "@/lib/admin-auth";
import { adminProductSchema, toProductRow } from "@/lib/product-validation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!await getAdminUser()) return Response.json({ message: "Niet geautoriseerd." }, { status: 401 });
  const parsed = adminProductSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Controleer de velden." }, { status: 400 });
  const { data, error } = await createAdminClient()!.from("products").insert(toProductRow(parsed.data)).select("id").single();
  if (error) return Response.json({ message: error.code === "23505" ? "Deze slug bestaat al." : "Opslaan is niet gelukt." }, { status: 400 });
  return Response.json(data, { status: 201 });
}

