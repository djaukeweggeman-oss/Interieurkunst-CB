import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { AdminNav } from "@/components/admin-nav";
import { OrderStatusControls } from "@/components/order-status-controls";
import { getAdminUser } from "@/lib/admin-auth";
import { formatPrice } from "@/lib/catalog";
import type { Json } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Bestelling", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

function addressLines(value: Json | null) {
  if (!value || Array.isArray(value) || typeof value !== "object") return [];
  return [value.address_line, `${value.postal_code ?? ""} ${value.city ?? ""}`.trim(), value.country_code]
    .filter((line): line is string => typeof line === "string" && Boolean(line));
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getAdminUser(); if (!user) redirect("/admin/login");
  const parsed = z.uuid().safeParse((await params).id); if (!parsed.success) notFound();
  const supabase = createAdminClient()!;
  const [orderResult, itemsResult, reservationsResult] = await Promise.all([
    supabase.from("orders").select("*").eq("id", parsed.data).maybeSingle(),
    supabase.from("order_items").select("*").eq("order_id", parsed.data).order("created_at"),
    supabase.from("reservations").select("status,expires_at,created_at,released_at,converted_at").eq("order_id", parsed.data),
  ]);
  if (!orderResult.data) notFound();
  const order = orderResult.data;
  const timeline = [
    ["Aangemaakt", order.created_at], ["Betaald", order.paid_at], ["In behandeling", order.processed_at],
    ["Verzonden", order.shipped_at], ["Afgerond", order.completed_at], ["Geannuleerd", order.cancelled_at], ["Terugbetaald", order.refunded_at],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  const shippingLines = addressLines(order.shipping_address);
  return <main className="admin-page admin-subpage"><AdminNav email={user.email} role={user.role} />
    <nav className="breadcrumbs"><Link href="/admin/bestellingen">Bestellingen</Link><span>—</span><span>{order.order_number}</span></nav>
    <header className="admin-head"><div><p className="eyebrow">Bestelling</p><h1>{order.order_number}</h1></div><div><span>{order.status}</span><span>betaling: {order.payment_status}</span></div></header>
    <div className="admin-order-detail"><section><h2>Bestelde werken</h2>{(itemsResult.data ?? []).map((item) => <div className="summary-line" key={item.id}><span>{item.product_name}<small>{item.product_slug} · btw {item.vat_percentage}% ({formatPrice(item.vat_amount_cents)})</small></span><strong>{formatPrice(item.total_cents)}</strong></div>)}<div className="summary-line"><span>Verzending</span><strong>{formatPrice(order.shipping_cents)}</strong></div><div className="summary-total"><span>Totaal</span><strong>{formatPrice(order.total_cents)}</strong></div></section>
      <section><h2>Klant en levering</h2><dl className="admin-details"><div><dt>Naam</dt><dd>{order.customer_name}</dd></div><div><dt>E-mail</dt><dd><a href={`mailto:${order.customer_email}`}>{order.customer_email}</a></dd></div><div><dt>Telefoon</dt><dd>{order.customer_phone}</dd></div><div><dt>Levering</dt><dd>{order.delivery_method}</dd></div><div><dt>Adres</dt><dd>{shippingLines.length ? shippingLines.map((line) => <span key={line}>{line}</span>) : "Niet van toepassing"}</dd></div><div><dt>Mollie-ID</dt><dd>{order.mollie_payment_id ?? "Nog niet aangemaakt"}</dd></div>{order.customer_note && <div><dt>Notitie</dt><dd>{order.customer_note}</dd></div>}</dl></section>
      <section><h2>Tijdlijn</h2><ol className="admin-timeline">{timeline.map(([label, date]) => <li key={label}><strong>{label}</strong><span>{new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date))}</span></li>)}</ol>{(reservationsResult.data ?? []).map((reservation) => <p className="content-note" key={reservation.created_at}>Reservering: {reservation.status} · vervalt {new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(reservation.expires_at))}</p>)}</section>
      <OrderStatusControls id={order.id} orderNumber={order.order_number} status={order.status} paymentStatus={order.payment_status} canRefund={user.role === "admin"} />
    </div>
  </main>;
}
