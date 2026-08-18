import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { AdminSettings } from "@/components/admin-settings";
import { requireAdminRole } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Website-instellingen", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireAdminRole(); if (!user) redirect("/admin");
  const supabase = createAdminClient()!;
  const settings = await supabase.from("site_settings").select("key,value,is_public").order("key");
  return <main className="admin-page admin-subpage"><AdminNav email={user.email} role={user.role} /><header className="admin-head"><div><p className="eyebrow">Centraal beheer</p><h1>Instellingen</h1></div></header><p className="content-note">Alleen publieke bedrijfs-, contact-, leverings-, sociale en SEO-gegevens horen hier. Sla nooit API-sleutels of wachtwoorden in deze tabel op.</p><AdminSettings settings={settings.data ?? []} /></main>;
}
