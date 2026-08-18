import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { sanitizePlainText } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

type Context = { params: Promise<{ id: string; imageId: string }> };
const patchSchema = z.object({
  altText: z.string().trim().max(300).optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  isPrimary: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: Context) {
  if (!await getAdminUser()) return Response.json({ message: "Niet geautoriseerd." }, { status: 401 });
  const identifiers = z.object({ id: z.uuid(), imageId: z.uuid() }).safeParse(await params);
  const body = patchSchema.safeParse(await request.json().catch(() => null));
  if (!identifiers.success || !body.success) return Response.json({ message: "Ongeldige wijziging." }, { status: 400 });
  const supabase = createAdminClient();
  if (!supabase) return Response.json({ message: "Supabase is niet volledig geconfigureerd." }, { status: 503 });

  const product = await supabase.from("products").select("slug").eq("id", identifiers.data.id).maybeSingle();
  if (!product.data) return Response.json({ message: "Werk niet gevonden." }, { status: 404 });
  if (body.data.isPrimary) {
    await supabase.from("product_images").update({ is_primary: false }).eq("product_id", identifiers.data.id);
  }
  const update = {
    ...(body.data.altText === undefined ? {} : { alt_text: sanitizePlainText(body.data.altText, 300) }),
    ...(body.data.sortOrder === undefined ? {} : { sort_order: body.data.sortOrder }),
    ...(body.data.isPrimary === undefined ? {} : { is_primary: body.data.isPrimary }),
  };
  const { error } = await supabase.from("product_images").update(update)
    .eq("id", identifiers.data.imageId).eq("product_id", identifiers.data.id);
  if (error) return Response.json({ message: "Afbeelding bijwerken is niet gelukt." }, { status: 400 });
  revalidateTag("catalog", "max"); revalidatePath(`/collectie/${product.data.slug}`);
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!await getAdminUser()) return Response.json({ message: "Niet geautoriseerd." }, { status: 401 });
  const identifiers = z.object({ id: z.uuid(), imageId: z.uuid() }).safeParse(await params);
  if (!identifiers.success) return Response.json({ message: "Ongeldige afbeelding." }, { status: 400 });
  const supabase = createAdminClient();
  if (!supabase) return Response.json({ message: "Supabase is niet volledig geconfigureerd." }, { status: 503 });

  const [product, image] = await Promise.all([
    supabase.from("products").select("slug").eq("id", identifiers.data.id).maybeSingle(),
    supabase.from("product_images").select("storage_path,is_primary").eq("id", identifiers.data.imageId)
      .eq("product_id", identifiers.data.id).maybeSingle(),
  ]);
  if (!product.data || !image.data) return Response.json({ message: "Afbeelding niet gevonden." }, { status: 404 });
  const storageResult = await supabase.storage.from("product-images").remove([image.data.storage_path]);
  if (storageResult.error) return Response.json({ message: "Bestand verwijderen is niet gelukt." }, { status: 500 });
  const { error } = await supabase.from("product_images").delete().eq("id", identifiers.data.imageId);
  if (error) return Response.json({ message: "Afbeelding verwijderen is niet gelukt." }, { status: 500 });
  if (image.data.is_primary) {
    const next = await supabase.from("product_images").select("id").eq("product_id", identifiers.data.id).order("sort_order").limit(1).maybeSingle();
    if (next.data) await supabase.from("product_images").update({ is_primary: true }).eq("id", next.data.id);
  }
  revalidateTag("catalog", "max"); revalidatePath(`/collectie/${product.data.slug}`);
  return Response.json({ ok: true });
}
