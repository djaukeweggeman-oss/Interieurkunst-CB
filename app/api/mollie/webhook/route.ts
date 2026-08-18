import createMollieClient from "@mollie/api-client";
import { z } from "zod";
import { emailService } from "@/lib/email/service";
import { normalizeMollieStatus } from "@/lib/order-rules";
import { logServerError, secretsMatch } from "@/lib/security";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!secretsMatch(token, process.env.MOLLIE_WEBHOOK_SECRET)) return new Response("Unauthorized", { status: 401 });

  const contentType = request.headers.get("content-type") ?? "";
  const id = contentType.includes("application/json")
    ? (await request.json().catch(() => null) as { id?: string } | null)?.id
    : (await request.formData().catch(() => null))?.get("id");
  const parsedPaymentId = z.string().regex(/^tr_[A-Za-z0-9]+$/).safeParse(id);
  if (!parsedPaymentId.success) return new Response("Invalid payment id", { status: 400 });

  const supabase = createAdminClient();
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!supabase || !apiKey) return new Response("Integration unavailable", { status: 503 });
  try {
    const payment = await createMollieClient({ apiKey }).payments.get(parsedPaymentId.data);
    const metadata = typeof payment.metadata === "object" && payment.metadata ? payment.metadata : null;
    const orderId = metadata && "order_id" in metadata ? String(metadata.order_id) : null;
    const parsedOrderId = z.uuid().safeParse(orderId);
    const status = normalizeMollieStatus(payment.status);
    if (!parsedOrderId.success || !status || payment.amount.currency !== "EUR") {
      return new Response("Invalid payment metadata", { status: 400 });
    }

    const order = await supabase.from("orders").select("total_cents,mollie_payment_id").eq("id", parsedOrderId.data).maybeSingle();
    if (!order.data || (order.data.mollie_payment_id && order.data.mollie_payment_id !== payment.id)) {
      return new Response("Payment mismatch", { status: 409 });
    }
    if (payment.amount.value !== (order.data.total_cents / 100).toFixed(2)) {
      return new Response("Amount mismatch", { status: 409 });
    }

    const result = await supabase.rpc("process_mollie_payment", {
      p_order_id: parsedOrderId.data,
      p_payment_id: payment.id,
      p_status: status,
    });
    if (result.error) return new Response("Retry", { status: 500 });
    if (result.data && status === "paid") {
      const paidOrder = await supabase.from("orders").select("customer_email,order_number").eq("id", parsedOrderId.data).maybeSingle();
      if (paidOrder.data) await emailService.queue({
        type: "payment_confirmed",
        recipient: paidOrder.data.customer_email,
        payload: { order_id: parsedOrderId.data, order_number: paidOrder.data.order_number },
      });
    }
    return new Response("OK");
  } catch (error) {
    logServerError("mollie-webhook", error);
    return new Response("Retry", { status: 502 });
  }
}
