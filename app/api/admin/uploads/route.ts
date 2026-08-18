import { randomUUID } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { processSafeImage } from "@/lib/image-processing";
import { logServerError, sanitizePlainText } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!await getAdminUser()) return Response.json({ message: "Niet geautoriseerd." }, { status: 401 });
  const supabase = createAdminClient();
  if (!supabase) return Response.json({ message: "Supabase is niet volledig geconfigureerd." }, { status: 503 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const productId = z.uuid().safeParse(form?.get("productId"));
  const altText = sanitizePlainText(String(form?.get("altText") ?? ""), 300);
  if (!(file instanceof File) || !productId.success) {
    return Response.json({ message: "Selecteer een geldig afbeeldingsbestand." }, { status: 400 });
  }

  const product = await supabase.from("products").select("id,slug,name").eq("id", productId.data).maybeSingle();
  if (!product.data) return Response.json({ message: "Werk niet gevonden." }, { status: 404 });

  try {
    const image = await processSafeImage(file);
    const path = `${productId.data}/${randomUUID()}.${image.extension}`;
    const { error: uploadError } = await supabase.storage.from("product-images").upload(path, image.buffer, {
      contentType: image.mime,
      cacheControl: "31536000",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const existing = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId.data);
    const { data, error } = await supabase.from("product_images").insert({
      product_id: productId.data,
      storage_path: path,
      alt_text: altText || product.data.name,
      sort_order: existing.count ?? 0,
      is_primary: (existing.count ?? 0) === 0,
      width: image.width,
      height: image.height,
    }).select("id,storage_path").single();
    if (error) {
      await supabase.storage.from("product-images").remove([path]);
      throw error;
    }
    revalidateTag("catalog", "max");
    revalidatePath(`/collectie/${product.data.slug}`);
    return Response.json(data, { status: 201 });
  } catch (error) {
    logServerError("product-upload", error);
    return Response.json({ message: "De afbeelding kon niet veilig worden verwerkt of opgeslagen." }, { status: 400 });
  }
}
