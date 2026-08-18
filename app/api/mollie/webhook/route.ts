import createMollieClient from "@mollie/api-client";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const id = contentType.includes("application/json") ? (await request.json().catch(() => null) as { id?: string } | null)?.id : (await request.formData()).get("id");
  const parsed = z.string().regex(/^tr_[A-Za-z0-9]+$/).safeParse(id);
  if (!parsed.success) return new Response("Invalid payment id", { status: 400 });
  const supabase = createAdminClient();
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!supabase || !apiKey) return new Response("Integration unavailable", { status: 503 });
  try {
    const payment = await createMollieClient({ apiKey }).payments.get(parsed.data);
    const orderId = typeof payment.metadata === "object" && payment.metadata && "order_id" in payment.metadata ? String(payment.metadata.order_id) : null;
    if (!orderId) return new Response("Missing order reference", { status: 400 });
    const { error } = await supabase.rpc("process_mollie_payment", { p_order_id: orderId, p_payment_id: payment.id, p_status: payment.status });
    if (error) return new Response("Retry", { status: 500 });
    return new Response("OK");
  } catch { return new Response("Retry", { status: 502 }); }
}

