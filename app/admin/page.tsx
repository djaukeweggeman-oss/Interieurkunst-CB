import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminNav } from "@/components/admin-nav";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Beheer", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!hasSupabaseConfig()) return <main className="page-shell admin-setup"><p className="eyebrow">Beheer</p><h1>Nog niet gekoppeld</h1><p>De beveiligde beheeromgeving staat klaar. Voeg eerst de Supabase-URL en service-role key toe en voer beide migraties uit.</p></main>;
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  const supabase = createAdminClient()!;
  const [productResult, categoryResult, imageResult, orderResult, commissionResult, contactResult] = await Promise.all([
    supabase.from("products").select("*").neq("status", "archived").order("created_at", { ascending: false }),
    supabase.from("categories").select("id,name").eq("is_active", true).order("sort_order"),
    supabase.from("product_images").select("*").order("sort_order"),
    supabase.from("orders").select("id", { count: "exact", head: true }),
    supabase.from("commission_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("contact_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);
  const signedImages = await supabase.storage.from("product-images").createSignedUrls((imageResult.data ?? []).map((image) => image.storage_path), 60 * 60);
  const signedUrlMap = new Map((signedImages.data ?? []).map((image) => [image.path, image.signedUrl]));
  const products = (productResult.data ?? []).map((product) => ({
    ...product,
    images: (imageResult.data ?? []).filter((image) => image.product_id === product.id).map((image) => ({
      ...image,
      public_url: signedUrlMap.get(image.storage_path) ?? "",
    })),
  }));
  return <main className="admin-page">
    <AdminNav email={user.email} role={user.role} />
    <header className="admin-head"><div><p className="eyebrow">Interieurkunst CB</p><h1>Atelierbeheer</h1></div><div><span>{orderResult.count ?? 0} bestellingen</span><span>{(commissionResult.count ?? 0) + (contactResult.count ?? 0)} nieuwe aanvragen</span></div></header>
    <AdminDashboard products={products} categories={categoryResult.data ?? []} />
  </main>;
}
