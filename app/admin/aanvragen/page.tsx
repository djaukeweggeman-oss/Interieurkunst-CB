import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { AdminRequests } from "@/components/admin-requests";
import { getAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Aanvragen beheren", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const user = await getAdminUser(); if (!user) redirect("/admin/login");
  const supabase = createAdminClient()!;
  const [contacts, commissions] = await Promise.all([
    supabase.from("contact_requests").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("commission_requests").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  const imagePaths = (commissions.data ?? []).flatMap((item) => item.reference_image_path ? [item.reference_image_path] : []);
  const signedImages = imagePaths.length
    ? await supabase.storage.from("commission-uploads").createSignedUrls(imagePaths, 5 * 60)
    : { data: [] };
  const signedUrlMap = new Map((signedImages.data ?? []).map((image) => [image.path, image.signedUrl]));
  const commissionItems = (commissions.data ?? []).map((item) => ({
      id: item.id, kind: "commission" as const, name: item.name, email: item.email, phone: item.phone,
      subject: `${item.commission_type}${item.preferred_size ? ` · ${item.preferred_size}` : ""}`,
      message: [item.message, item.preferred_style && `Stijl: ${item.preferred_style}`, item.preferred_colours && `Kleuren: ${item.preferred_colours}`, item.desired_date && `Gewenste datum: ${item.desired_date}`].filter(Boolean).join("\n\n"),
      status: item.status, adminNotes: item.admin_notes, createdAt: item.created_at,
      imageUrl: item.reference_image_path ? signedUrlMap.get(item.reference_image_path) ?? null : null,
    }));
  const contactItems = (contacts.data ?? []).map((item) => ({
    id: item.id, kind: "contact" as const, name: item.name, email: item.email, phone: item.phone,
    subject: item.subject, message: item.message, status: item.status, adminNotes: item.admin_notes,
    createdAt: item.created_at,
  }));
  const items = [...contactItems, ...commissionItems].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <main className="admin-page admin-subpage"><AdminNav email={user.email} role={user.role} /><header className="admin-head"><div><p className="eyebrow">Contact en opdrachten</p><h1>Aanvragen</h1></div><div><span>{contactItems.length} contact</span><span>{commissionItems.length} opdrachten</span></div></header><AdminRequests items={items} /></main>;
}
