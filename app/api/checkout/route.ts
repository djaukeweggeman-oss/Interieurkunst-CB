import createMollieClient from "@mollie/api-client";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  productIds: z.array(z.uuid()).min(1).max(10), name: z.string().trim().min(2).max(100), email: z.email().max(254), phone: z.string().trim().min(6).max(30),
  delivery: z.enum(["pickup", "shipping", "consultation"]), address: z.string().trim().max(200).optional(), postalCode: z.string().trim().max(20).optional(), city: z.string().trim().max(100).optional(), terms: z.literal("on"),
}).superRefine((data, context) => { if (data.delivery === "shipping" && (!data.address || !data.postalCode || !data.city)) context.addIssue({ code: "custom", message: "Vul het afleveradres volledig in." }); });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ message: parsed.error.issues[0]?.message ?? "Controleer je gegevens." }, { status: 400 });
  const supabase = createAdminClient();
  if (!supabase) return Response.json({ message: "De veilige bestelopslag is nog niet gekoppeld. De bestelling is niet aangemaakt." }, { status: 503 });
  const { data: reservation, error } = await supabase.rpc("reserve_products_for_checkout", { p_product_ids: parsed.data.productIds, p_customer: { name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, address: parsed.data.address, postal_code: parsed.data.postalCode, city: parsed.data.city }, p_delivery_method: parsed.data.delivery });
  if (error || !reservation?.[0]) return Response.json({ message: "Een werk is net gereserveerd of niet meer beschikbaar." }, { status: 409 });
  const row = reservation[0] as { order_id: string; public_token: string; total_cents: number; order_number: string };
  const apiKey = process.env.MOLLIE_API_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!apiKey || !siteUrl || siteUrl.includes("localhost")) {
    await supabase.rpc("release_order_reservation", { p_order_id: row.order_id });
    return Response.json({ message: "Mollie-testbetalingen zijn nog niet geconfigureerd. De reservering is veilig vrijgegeven." }, { status: 503 });
  }
  const mollie = createMollieClient({ apiKey });
  try {
    const payment = await mollie.payments.create({ amount: { currency: "EUR", value: (row.total_cents / 100).toFixed(2) }, description: `Interieurkunst CB ${row.order_number}`, redirectUrl: `${siteUrl}/bestelling/${row.public_token}`, webhookUrl: `${siteUrl}/api/mollie/webhook`, metadata: { order_id: row.order_id } });
    await supabase.from("orders").update({ mollie_payment_id: payment.id, payment_status: payment.status }).eq("id", row.order_id);
    const checkoutUrl = payment.getCheckoutUrl();
    if (!checkoutUrl) throw new Error("Mollie leverde geen checkout-URL.");
    return Response.json({ checkoutUrl });
  } catch {
    await supabase.rpc("release_order_reservation", { p_order_id: row.order_id });
    return Response.json({ message: "De betaling kon niet worden voorbereid. Er is niets afgeschreven." }, { status: 502 });
  }
}

