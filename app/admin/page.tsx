import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin-dashboard";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient, hasSupabaseConfig } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Beheer", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  if (!hasSupabaseConfig()) return <main className="page-shell admin-setup"><p className="eyebrow">Beheer</p><h1>Nog niet gekoppeld</h1><p>De beveiligde beheeromgeving staat klaar. Koppel eerst Supabase en voer de migratie uit; er wordt geen tijdelijke of onveilige beheerder aangemaakt.</p></main>;
  const user = await getAdminUser(); if (!user) redirect("/admin/login");
  const supabase = createAdminClient()!;
  const [productResult, categoryResult, orderResult, commissionResult] = await Promise.all([supabase.from("products").select("*").is("archived_at", null).order("created_at", { ascending: false }), supabase.from("categories").select("id,name").eq("active", true).order("sort_order"), supabase.from("orders").select("id", { count: "exact", head: true }), supabase.from("commission_requests").select("id", { count: "exact", head: true }).eq("status", "new")]);
  return <main className="admin-page"><header className="admin-head"><div><p className="eyebrow">Interieurkunst CB</p><h1>Atelierbeheer</h1></div><div><span>{orderResult.count ?? 0} bestellingen</span><span>{commissionResult.count ?? 0} nieuwe aanvragen</span></div></header><AdminDashboard products={productResult.data ?? []} categories={categoryResult.data ?? []} /></main>;
}
