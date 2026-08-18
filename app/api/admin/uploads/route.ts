import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
export async function POST(request: Request) {
  if (!await getAdminUser()) return Response.json({ message: "Niet geautoriseerd." }, { status: 401 });
  const form = await request.formData(); const file = form.get("file"); const productId = z.uuid().safeParse(form.get("productId"));
  if (!(file instanceof File) || !productId.success || !allowed.has(file.type) || file.size > 10 * 1024 * 1024) return Response.json({ message: "Ongeldig bestand." }, { status: 400 });
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${productId.data}/${randomUUID()}.${extension}`; const supabase = createAdminClient()!;
  const { error: uploadError } = await supabase.storage.from("artworks").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return Response.json({ message: "Uploaden is niet gelukt." }, { status: 500 });
  const { count } = await supabase.from("product_images").select("id", { count: "exact", head: true }).eq("product_id", productId.data);
  const { error } = await supabase.from("product_images").insert({ product_id: productId.data, storage_path: path, sort_order: count ?? 0, is_primary: (count ?? 0) === 0 });
  if (error) { await supabase.storage.from("artworks").remove([path]); return Response.json({ message: "Afbeelding kon niet worden gekoppeld." }, { status: 500 }); }
  return Response.json({ ok: true, path }, { status: 201 });
}
