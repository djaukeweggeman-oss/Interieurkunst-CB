import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Bestelstatus", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OrderStatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const parsed = z.uuid().safeParse(token);
  const supabase = createAdminClient();
  const result = parsed.success && supabase ? await supabase.from("orders").select("order_number,payment_status,status").eq("public_token", token).maybeSingle() : null;
  const order = result?.data;
  return <main className="page-shell status-page"><p className="eyebrow">Bestelstatus</p><h1>{order?.payment_status === "paid" ? "Betaling ontvangen" : "Betaling wordt gecontroleerd"}</h1><p>{order ? `Bestelling ${order.order_number}. We vertrouwen niet op de terugkeer uit de browser; de definitieve status wordt rechtstreeks bij Mollie gecontroleerd.` : "Deze bestelling kon niet worden gevonden of de koppeling is nog niet ingesteld."}</p><Link className="button button-dark" href="/collectie">Terug naar de shop ↗</Link></main>;
}
