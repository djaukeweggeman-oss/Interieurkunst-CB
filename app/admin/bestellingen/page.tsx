import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AdminNav } from "@/components/admin-nav";
import { getAdminUser } from "@/lib/admin-auth";
import { formatPrice } from "@/lib/catalog";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Bestellingen beheren", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const orderStatuses = ["pending", "awaiting_payment", "paid", "processing", "shipped", "completed", "cancelled", "refunded"] as const;
const paymentStatuses = ["open", "pending", "paid", "failed", "expired", "cancelled", "refunded"] as const;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; payment?: string }> }) {
  const user = await getAdminUser(); if (!user) redirect("/admin/login");
  const filters = await searchParams;
  const supabase = createAdminClient()!;
  let query = supabase.from("orders").select("id,order_number,status,payment_status,customer_name,customer_email,total_cents,created_at")
    .order("created_at", { ascending: false }).limit(100);
  const status = z.enum(orderStatuses).safeParse(filters.status);
  const payment = z.enum(paymentStatuses).safeParse(filters.payment);
  if (status.success) query = query.eq("status", status.data);
  if (payment.success) query = query.eq("payment_status", payment.data);
  const search = filters.q?.trim().replace(/[%_,().]/g, "").slice(0, 100);
  if (search) query = query.or(`order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
  const result = await query;
  return <main className="admin-page admin-subpage"><AdminNav email={user.email} role={user.role} />
    <header className="admin-head"><div><p className="eyebrow">Bestellingen</p><h1>Orderbeheer</h1></div></header>
    <form className="admin-filters"><label>Zoeken<input name="q" defaultValue={filters.q} placeholder="Ordernummer, naam of e-mail" /></label><label>Orderstatus<select name="status" defaultValue={filters.status ?? ""}><option value="">Alles</option>{orderStatuses.map((value) => <option key={value}>{value}</option>)}</select></label><label>Betaalstatus<select name="payment" defaultValue={filters.payment ?? ""}><option value="">Alles</option>{paymentStatuses.map((value) => <option key={value}>{value}</option>)}</select></label><button className="button button-dark" type="submit">Filter</button></form>
    <section className="admin-table" aria-label="Bestellingen">{result.error ? <div className="empty-state"><h2>Bestellingen konden niet worden geladen</h2><p>Controleer de Supabase-migratie en probeer het opnieuw.</p></div> : result.data.length ? result.data.map((order) => <Link className="admin-order-row" href={`/admin/bestellingen/${order.id}`} key={order.id}><div><strong>{order.order_number}</strong><span>{new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.created_at))}</span></div><div><strong>{order.customer_name}</strong><span>{order.customer_email}</span></div><div><span>{order.status}</span><span>betaling: {order.payment_status}</span></div><strong>{formatPrice(order.total_cents)}</strong></Link>) : <div className="empty-state"><h2>Nog geen bestellingen</h2><p>Zodra een checkout is gestart, verschijnt de bestelling hier.</p></div>}</section>
  </main>;
}
