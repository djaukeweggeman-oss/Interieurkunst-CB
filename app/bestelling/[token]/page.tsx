import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { OrderStatusClient } from "@/components/order-status-client";

export const metadata: Metadata = { title: "Bestelstatus", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OrderStatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const parsed = z.uuid().safeParse(token);
  const supabase = createAdminClient();
  const result = parsed.success && supabase ? await supabase.from("orders").select("order_number,payment_status,status,updated_at").eq("public_token", token).maybeSingle() : null;
  const order = result?.data;
  const paid = order?.payment_status === "paid";
  const pending = order ? ["open", "pending"].includes(order.payment_status) : false;
  const title = paid ? "Betaling ontvangen" : pending ? "Betaling wordt gecontroleerd" : order ? "Betaling niet voltooid" : "Bestelling niet gevonden";
  return <main className="page-shell status-page"><OrderStatusClient paid={paid} pending={pending} /><p className="eyebrow">Bestelstatus</p><h1>{title}</h1><p>{order ? `Bestelling ${order.order_number} heeft betaalstatus “${order.payment_status}”. Deze status komt uitsluitend uit de door Mollie geverifieerde serververwerking.` : "Deze bestelling kon niet worden gevonden of de beveiligde koppeling is nog niet ingesteld."}</p>{pending && <p className="content-note">Deze pagina controleert de status automatisch opnieuw. Je kunt de pagina ook veilig verversen.</p>}<Link className="button button-dark" href="/collectie">Terug naar de shop ↗</Link></main>;
}
