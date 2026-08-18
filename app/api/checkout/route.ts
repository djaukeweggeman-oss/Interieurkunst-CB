import createMollieClient from "@mollie/api-client";
import { emailService } from "@/lib/email/service";
import { checkoutSchema } from "@/lib/request-validation";
import { normalizeMollieStatus } from "@/lib/order-rules";
import { checkServerRateLimit, logServerError } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/lib/site-config";

type ReservedOrder = {
  order_id: string;
  public_token: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  order_number: string;
};

export async function POST(request: Request) {
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ message: parsed.error.issues[0]?.message ?? "Controleer je gegevens." }, { status: 400 });
  }
  const rateLimit = await checkServerRateLimit(request, "checkout", 5, 15 * 60);
  if (!rateLimit.configured) {
    return Response.json({ message: "De veilige bestelopslag is nog niet volledig gekoppeld. Er is niets besteld." }, { status: 503 });
  }
  if (!rateLimit.allowed) {
    return Response.json({ message: "Er zijn te veel betaalpogingen gestart. Probeer het over enkele minuten opnieuw." }, { status: 429 });
  }

  const supabase = createAdminClient();
  if (!supabase) return Response.json({ message: "De veilige bestelopslag is niet beschikbaar." }, { status: 503 });
  const shippingAddress = parsed.data.delivery === "shipping" ? {
    address_line: parsed.data.address!,
    postal_code: parsed.data.postalCode!,
    city: parsed.data.city!,
    country_code: "NL",
  } : null;
  const { data: reservation, error } = await supabase.rpc("reserve_products_for_checkout", {
    p_product_ids: parsed.data.productIds,
    p_customer: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      billing_address: shippingAddress,
      shipping_address: shippingAddress,
      note: parsed.data.note ?? "",
    },
    p_delivery_method: parsed.data.delivery,
  });
  if (error || !reservation?.[0]) {
    return Response.json({ message: "Een werk is net gereserveerd of niet meer beschikbaar." }, { status: 409 });
  }
  const order = reservation[0] as ReservedOrder;

  const apiKey = process.env.MOLLIE_API_KEY;
  const webhookSecret = process.env.MOLLIE_WEBHOOK_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!apiKey || !webhookSecret || !siteUrl || siteUrl.includes("localhost")) {
    await supabase.rpc("release_order_reservation", { p_order_id: order.order_id });
    return Response.json({
      message: "Mollie-testbetalingen zijn nog niet volledig geconfigureerd. De reservering is veilig vrijgegeven.",
    }, { status: 503 });
  }

  const mollie = createMollieClient({ apiKey });
  try {
    const payment = await mollie.payments.create({
      amount: { currency: "EUR", value: (order.total_cents / 100).toFixed(2) },
      description: `Interieurkunst CB ${order.order_number}`,
      redirectUrl: `${siteUrl}/bestelling/${order.public_token}`,
      webhookUrl: `${siteUrl}/api/mollie/webhook?token=${encodeURIComponent(webhookSecret)}`,
      metadata: { order_id: order.order_id, order_number: order.order_number },
    });
    const paymentStatus = normalizeMollieStatus(payment.status) ?? "open";
    const update = await supabase.from("orders").update({
      mollie_payment_id: payment.id,
      payment_status: paymentStatus,
    }).eq("id", order.order_id);
    if (update.error) throw update.error;
    const checkoutUrl = payment.getCheckoutUrl();
    if (!checkoutUrl) throw new Error("MOLLIE_CHECKOUT_URL_MISSING");
    await Promise.all([
      emailService.queue({ type: "order_received", recipient: parsed.data.email, payload: { order_id: order.order_id, order_number: order.order_number } }),
      emailService.queue({ type: "new_order_admin", recipient: process.env.ADMIN_EMAIL ?? siteConfig.email, payload: { order_id: order.order_id, order_number: order.order_number } }),
    ]);
    return Response.json({ checkoutUrl, orderNumber: order.order_number });
  } catch (error) {
    logServerError("checkout", error);
    await supabase.rpc("release_order_reservation", { p_order_id: order.order_id });
    return Response.json({ message: "De betaling kon niet worden voorbereid. Er is niets afgeschreven." }, { status: 502 });
  }
}
