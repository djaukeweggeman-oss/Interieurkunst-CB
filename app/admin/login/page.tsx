import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin-login-form";
import { getAdminUser } from "@/lib/admin-auth";
import { hasPublicSupabaseConfig } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Beheer inloggen", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function AdminLoginPage() {
  if (await getAdminUser()) redirect("/admin");
  return <main className="admin-login"><div><p className="eyebrow">Privé beheer</p><h1>Welkom terug, Carolien.</h1><p>Beheer hier straks je collectie, bestellingen en aanvragen.</p>{hasPublicSupabaseConfig() ? <AdminLoginForm /> : <div className="setup-panel"><strong>Supabase-koppeling nodig</strong><p>Voeg eerst de project-URL en publieke sleutel toe aan je lokale omgevingsbestand. Er is geen onveilige noodlogin.</p></div>}</div></main>;
}

